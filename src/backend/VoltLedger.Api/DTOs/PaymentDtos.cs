using System.ComponentModel.DataAnnotations;
using VoltLedger.Api.Models;

namespace VoltLedger.Api.DTOs
{
    public class CreatePaymentRequestDto
    {
        [Required]
        public Guid LoanId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue)]
        public int AmountKes { get; set; }
        
        public PaymentMethod Method { get; set; } = PaymentMethod.mpesa;
        
        [StringLength(15)]
        public string? PhoneNumber { get; set; }
    }

    public class PaymentResponseDto
    {
        public Guid PaymentId { get; set; }
        public Guid LoanId { get; set; }
        public string Amount { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? MpesaReceiptNumber { get; set; }
        public string? PhoneNumberUsed { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class MpesaStkPushRequestDto
    {
        [Required]
        public Guid LoanId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue)]
        public int AmountKes { get; set; }
        
        [Required]
        [RegularExpression(@"^254[0-9]{9}$", ErrorMessage = "Phone number must be in Kenyan format: 2547XXXXXXXX")]
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class MpesaStkPushResponseDto
    {
        public bool Success { get; set; }
        public string? CheckoutRequestId { get; set; }
        public string? MerchantRequestId { get; set; }
        public string? ResponseCode { get; set; }
        public string? ResponseDescription { get; set; }
        public string? CustomerMessage { get; set; }
    }

    public class MpesaCallbackRequestDto
    {
        public MpesaBody Body { get; set; } = new();
    }

    public class MpesaBody
    {
        public MpesaStkCallback StkCallback { get; set; } = new();
    }

    public class MpesaStkCallback
    {
        public string MerchantRequestID { get; set; } = string.Empty;
        public string CheckoutRequestID { get; set; } = string.Empty;
        public int ResultCode { get; set; }
        public string ResultDesc { get; set; } = string.Empty;
        public MpesaCallbackMetadata? CallbackMetadata { get; set; }
    }

    public class MpesaCallbackMetadata
    {
        public List<MpesaItem> Item { get; set; } = new();
    }

    public class MpesaItem
    {
        public string Name { get; set; } = string.Empty;
        public object? Value { get; set; }
    }

    public class PaymentFilterDto
    {
        public Guid? LoanId { get; set; }
        public Guid? UserId { get; set; }
        public PaymentStatus? Status { get; set; }
        public PaymentMethod? Method { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
