using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using VoltLedger.Api.DTOs;

namespace VoltLedger.Api.Services
{
    /// <summary>
    /// M-Pesa Daraja API integration service
    /// Implements STK Push, B2C, and C2B functionality per fintech specs
    /// </summary>
    public interface IMpesaService
    {
        Task<MpesaStkPushResponseDto> InitiateStkPushAsync(MpesaStkPushRequestDto request);
        Task<bool> ProcessCallbackAsync(MpesaCallbackRequestDto callback);
        Task<bool> RegisterUrlsAsync(string confirmationUrl, string validationUrl);
        Task<bool> SendB2CAsync(string phoneNumber, int amountKes, string occasion);
    }

    public class MpesaService : IMpesaService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MpesaService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _baseUrl;
        private readonly string _consumerKey;
        private readonly string _consumerSecret;
        private readonly string _passKey;
        private readonly string _businessShortCode;
        private string? _accessToken;
        private DateTime _tokenExpiry = DateTime.MinValue;

        public MpesaService(
            HttpClient httpClient, 
            ILogger<MpesaService> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;
            
            // Sandbox vs Production URLs
            bool isProduction = _configuration.GetValue<bool>("Mpesa:IsProduction");
            _baseUrl = isProduction 
                ? "https://api.safaricom.co.ke" 
                : "https://sandbox.safaricom.co.ke";
            
            _consumerKey = _configuration["Mpesa:ConsumerKey"] ?? string.Empty;
            _consumerSecret = _configuration["Mpesa:ConsumerSecret"] ?? string.Empty;
            _passKey = _configuration["Mpesa:PassKey"] ?? string.Empty;
            _businessShortCode = _configuration["Mpesa:BusinessShortCode"] ?? "174379";
        }

        /// <summary>
        /// Initiates M-Pesa STK Push (Lipa na M-Pesa Online)
        /// </summary>
        public async Task<MpesaStkPushResponseDto> InitiateStkPushAsync(MpesaStkPushRequestDto request)
        {
            try
            {
                var token = await GetAccessTokenAsync();
                
                var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
                var password = GeneratePassword(timestamp);
                
                var stkRequest = new
                {
                    BusinessShortCode = _businessShortCode,
                    Password = password,
                    Timestamp = timestamp,
                    TransactionType = "CustomerPayBillOnline",
                    Amount = request.AmountKes,
                    PartyA = request.PhoneNumber,
                    PartyB = _businessShortCode,
                    PhoneNumber = request.PhoneNumber,
                    CallBackURL = _configuration["Mpesa:CallbackUrl"],
                    AccountReference = $"LOAN-{request.LoanId.ToString()[..8]}",
                    TransactionDesc = "E-Bike Rental Payment"
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(stkRequest),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.PostAsync(
                    $"{_baseUrl}/mpesa/stkpush/v1/processrequest", 
                    content);

                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("STK Push Response: {Response}", responseBody);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<MpesaStkPushResponseDto>(responseBody);
                    return result ?? new MpesaStkPushResponseDto 
                    { 
                        Success = false, 
                        ResponseDescription = "Invalid response from M-Pesa" 
                    };
                }

                _logger.LogError("STK Push failed: {Response}", responseBody);
                return new MpesaStkPushResponseDto
                {
                    Success = false,
                    ResponseDescription = $"M-Pesa error: {responseBody}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating STK Push");
                return new MpesaStkPushResponseDto
                {
                    Success = false,
                    ResponseDescription = "Internal error processing request"
                };
            }
        }

        /// <summary>
        /// Processes M-Pesa callback (payment confirmation)
        /// </summary>
        public async Task<bool> ProcessCallbackAsync(MpesaCallbackRequestDto callback)
        {
            try
            {
                var stkCallback = callback.Body.StkCallback;
                _logger.LogInformation(
                    "Processing M-Pesa callback: CheckoutRequestID={CheckoutId}, ResultCode={ResultCode}",
                    stkCallback.CheckoutRequestID,
                    stkCallback.ResultCode);

                // ResultCode 0 = Success
                if (stkCallback.ResultCode == 0)
                {
                    // Extract payment details from callback metadata
                    decimal amount = 0;
                    string? receiptNumber = null;
                    string? phoneNumber = null;
                    DateTime? transactionDate = null;

                    if (stkCallback.CallbackMetadata?.Item != null)
                    {
                        foreach (var item in stkCallback.CallbackMetadata.Item)
                        {
                            switch (item.Name)
                            {
                                case "Amount":
                                    if (item.Value != null)
                                        amount = Convert.ToDecimal(item.Value);
                                    break;
                                case "MpesaReceiptNumber":
                                    receiptNumber = item.Value?.ToString();
                                    break;
                                case "PhoneNumber":
                                    phoneNumber = item.Value?.ToString();
                                    break;
                                case "TransactionDate":
                                    if (item.Value != null)
                                    {
                                        var dateStr = item.Value.ToString()!;
                                        if (dateStr.Length == 14)
                                            transactionDate = DateTime.ParseExact(
                                                dateStr, "yyyyMMddHHmmss", null);
                                    }
                                    break;
                            }
                        }
                    }

                    _logger.LogInformation(
                        "Successful payment: Amount={Amount}, Receipt={Receipt}, Phone={Phone}",
                        amount, receiptNumber, phoneNumber);

                    // TODO: Update payment record in database
                    // TODO: Trigger notifications
                    
                    return true;
                }
                else
                {
                    _logger.LogWarning(
                        "Payment failed: ResultCode={ResultCode}, Desc={Desc}",
                        stkCallback.ResultCode,
                        stkCallback.ResultDesc);
                    
                    // TODO: Update payment record with failure status
                    
                    return true; // Acknowledge callback
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing M-Pesa callback");
                return false;
            }
        }

        /// <summary>
        /// Registers validation and confirmation URLs for C2B payments
        /// </summary>
        public async Task<bool> RegisterUrlsAsync(string confirmationUrl, string validationUrl)
        {
            try
            {
                var token = await GetAccessTokenAsync();
                
                var request = new
                {
                    ShortCode = _businessShortCode,
                    ResponseType = "Completed", // or "Cancelled"
                    ConfirmationURL = confirmationUrl,
                    ValidationURL = validationUrl
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(request),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.PostAsync(
                    $"{_baseUrl}/mpesa/c2b/v1/registerurl", 
                    content);

                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Register URL Response: {Response}", responseBody);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering C2B URLs");
                return false;
            }
        }

        /// <summary>
        /// Sends B2C payment (Business to Customer - e.g., refunds)
        /// SecurityCredential should be encrypted per fintech specs
        /// </summary>
        public async Task<bool> SendB2CAsync(string phoneNumber, int amountKes, string occasion)
        {
            try
            {
                var token = await GetAccessTokenAsync();
                
                // The security credential should be base64 encoded and encrypted
                // per Safaricom's security requirements
                var securityCredential = _configuration["Mpesa:B2CSecurityCredential"] ?? "";
                var initiatorName = _configuration["Mpesa:B2CInitiatorName"] ?? "testapi";
                var queueTimeoutUrl = _configuration["Mpesa:B2CQueueTimeoutUrl"] ?? "";
                var resultUrl = _configuration["Mpesa:B2CResultUrl"] ?? "";
                var partyA = _configuration["Mpesa:B2CShortCode"] ?? "600584";

                var request = new
                {
                    InitiatorName = initiatorName,
                    SecurityCredential = securityCredential,
                    CommandID = "BusinessPayment", // or SalaryPayment, PromotionPayment
                    Amount = amountKes,
                    PartyA = partyA,
                    PartyB = phoneNumber,
                    Remarks = occasion,
                    QueueTimeOutURL = queueTimeoutUrl,
                    ResultURL = resultUrl,
                    Occasion = occasion
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(request),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.PostAsync(
                    $"{_baseUrl}/mpesa/b2c/v1/paymentrequest", 
                    content);

                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("B2C Response: {Response}", responseBody);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending B2C payment");
                return false;
            }
        }

        private async Task<string> GetAccessTokenAsync()
        {
            if (_accessToken != null && DateTime.UtcNow < _tokenExpiry)
            {
                return _accessToken;
            }

            var credentials = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{_consumerKey}:{_consumerSecret}"));

            _httpClient.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);

            var response = await _httpClient.GetAsync($"{_baseUrl}/oauth/v1/generate?grant_type=client_credentials");
            
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException("Failed to obtain M-Pesa access token");
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseBody);
            
            _accessToken = tokenResponse.GetProperty("access_token").GetString();
            var expiresIn = tokenResponse.GetProperty("expires_in").GetInt32();
            _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60); // Buffer

            return _accessToken!;
        }

        private string GeneratePassword(string timestamp)
        {
            var data = $"{_businessShortCode}{_passKey}{timestamp}";
            var bytes = Encoding.UTF8.GetBytes(data);
            return Convert.ToBase64String(bytes);
        }

        /// <summary>
        /// Encrypts security credential using M-Pesa certificate
        /// Per fintech specs for B2C SecurityCredential
        /// </summary>
        public static string EncryptSecurityCredential(string plainText, string publicKeyPath)
        {
            var publicKey = File.ReadAllText(publicKeyPath);
            using var rsa = RSA.Create();
            rsa.ImportFromPem(publicKey.ToCharArray());
            
            var data = Encoding.UTF8.GetBytes(plainText);
            var encrypted = rsa.Encrypt(data, RSAEncryptionPadding.Pkcs1);
            return Convert.ToBase64String(encrypted);
        }
    }
}
