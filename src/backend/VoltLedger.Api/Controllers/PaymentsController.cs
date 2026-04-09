using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltLedger.Api.Data;
using VoltLedger.Api.DTOs;
using VoltLedger.Api.Models;
using VoltLedger.Api.Services;

namespace VoltLedger.Api.Controllers
{
    /// <summary>
    /// Payment processing controller with M-Pesa integration
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IMpesaService _mpesaService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            ApplicationDbContext dbContext,
            IMpesaService mpesaService,
            ILogger<PaymentsController> logger)
        {
            _dbContext = dbContext;
            _mpesaService = mpesaService;
            _logger = logger;
        }

        /// <summary>
        /// Get all payments with filtering
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "admin,agent")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<PaymentResponseDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<PagedResult<PaymentResponseDto>>>> GetPayments(
            [FromQuery] PaymentFilterDto filter)
        {
            try
            {
                var query = _dbContext.Payments
                    .Include(p => p.User)
                    .Include(p => p.Loan)
                    .AsQueryable();

                // RLS - Agents can only see payments in their county
                if (User.IsInRole("agent") && !User.IsInRole("admin"))
                {
                    var county = User.FindFirst("county")?.Value;
                    if (!string.IsNullOrEmpty(county))
                    {
                        query = query.Where(p => p.User != null && p.User.HomeCounty == county);
                    }
                }

                // Apply filters
                if (filter.LoanId.HasValue)
                    query = query.Where(p => p.LoanId == filter.LoanId.Value);

                if (filter.UserId.HasValue)
                    query = query.Where(p => p.UserId == filter.UserId.Value);

                if (filter.Status.HasValue)
                    query = query.Where(p => p.Status == filter.Status.Value);

                if (filter.Method.HasValue)
                    query = query.Where(p => p.Method == filter.Method.Value);

                if (filter.DateFrom.HasValue)
                    query = query.Where(p => p.CreatedAt >= filter.DateFrom.Value);

                if (filter.DateTo.HasValue)
                    query = query.Where(p => p.CreatedAt <= filter.DateTo.Value);

                var totalCount = await query.CountAsync();
                var payments = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();

                var result = new PagedResult<PaymentResponseDto>
                {
                    Items = payments.Select(MapToDto).ToList(),
                    TotalCount = totalCount,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize
                };

                return Ok(ApiResponse<PagedResult<PaymentResponseDto>>.Ok(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving payments");
                return StatusCode(500, ApiResponse<PagedResult<PaymentResponseDto>>.Error(
                    "An error occurred while retrieving payments"));
            }
        }

        /// <summary>
        /// Get payment by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<PaymentResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<PaymentResponseDto>>> GetPayment(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var isAdmin = User.IsInRole("admin");
                var isAgent = User.IsInRole("agent");

                var payment = await _dbContext.Payments
                    .Include(p => p.User)
                    .Include(p => p.Loan)
                    .FirstOrDefaultAsync(p => p.PaymentId == id);

                if (payment == null)
                    return NotFound(ApiResponse<PaymentResponseDto>.NotFound("Payment not found"));

                // RLS check
                if (!isAdmin && payment.UserId != userId)
                {
                    if (isAgent)
                    {
                        var county = User.FindFirst("county")?.Value;
                        if (payment.User?.HomeCounty != county)
                            return NotFound(ApiResponse<PaymentResponseDto>.NotFound());
                    }
                    else
                    {
                        return NotFound(ApiResponse<PaymentResponseDto>.NotFound());
                    }
                }

                return Ok(ApiResponse<PaymentResponseDto>.Ok(MapToDto(payment)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving payment {PaymentId}", id);
                return StatusCode(500, ApiResponse<PaymentResponseDto>.Error(
                    "An error occurred while retrieving payment"));
            }
        }

        /// <summary>
        /// Get current user's payments
        /// </summary>
        [HttpGet("my-payments")]
        [ProducesResponseType(typeof(ApiResponse<List<PaymentResponseDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<List<PaymentResponseDto>>>> GetMyPayments()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(ApiResponse<List<PaymentResponseDto>>.Unauthorized());

                var payments = await _dbContext.Payments
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                return Ok(ApiResponse<List<PaymentResponseDto>>.Ok(
                    payments.Select(MapToDto).ToList()));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user payments");
                return StatusCode(500, ApiResponse<List<PaymentResponseDto>>.Error(
                    "An error occurred while retrieving payments"));
            }
        }

        /// <summary>
        /// Create a new payment record (for cash/bank transfers)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "admin,agent")]
        [ProducesResponseType(typeof(ApiResponse<PaymentResponseDto>), StatusCodes.Status201Created)]
        public async Task<ActionResult<ApiResponse<PaymentResponseDto>>> CreatePayment(
            [FromBody] CreatePaymentRequestDto request)
        {
            try
            {
                // Verify loan exists
                var loan = await _dbContext.Loans.FindAsync(request.LoanId);
                if (loan == null)
                    return BadRequest(ApiResponse<PaymentResponseDto>.Error("Loan not found"));

                var payment = new Payment
                {
                    PaymentId = Guid.NewGuid(),
                    LoanId = request.LoanId,
                    UserId = loan.UserId,
                    Amount = Money.FromKes(request.AmountKes),
                    Method = request.Method,
                    Status = PaymentStatus.completed, // Direct completion for non-M-Pesa
                    PhoneNumberUsed = request.PhoneNumber,
                    CompletedAt = DateTime.UtcNow,
                    CollectedBy = GetCurrentUserId()
                };

                _dbContext.Payments.Add(payment);

                // Update loan payment tracking
                loan.TotalPaid = loan.TotalPaid + payment.Amount;
                loan.BalanceDue = loan.BalanceDue - payment.Amount;
                if (loan.BalanceDue.Cents <= 0)
                {
                    loan.Status = LoanStatus.completed;
                }
                
                _dbContext.Loans.Update(loan);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Payment created: {PaymentId} for Loan: {LoanId}", 
                    payment.PaymentId, request.LoanId);

                return CreatedAtAction(nameof(GetPayment), new { id = payment.PaymentId },
                    ApiResponse<PaymentResponseDto>.Created(MapToDto(payment), "Payment recorded"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                return StatusCode(500, ApiResponse<PaymentResponseDto>.Error(
                    "An error occurred while creating payment"));
            }
        }

        /// <summary>
        /// Initiate M-Pesa STK Push payment
        /// </summary>
        [HttpPost("mpesa/stkpush")]
        [ProducesResponseType(typeof(ApiResponse<MpesaStkPushResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<MpesaStkPushResponseDto>>> InitiateStkPush(
            [FromBody] MpesaStkPushRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(ApiResponse<MpesaStkPushResponseDto>.Unauthorized());

                // Verify loan belongs to user
                var loan = await _dbContext.Loans
                    .FirstOrDefaultAsync(l => l.LoanId == request.LoanId);

                if (loan == null)
                    return BadRequest(ApiResponse<MpesaStkPushResponseDto>.Error("Loan not found"));

                if (loan.UserId != userId && !User.IsInRole("admin"))
                    return Forbid();

                // Create pending payment record
                var payment = new Payment
                {
                    PaymentId = Guid.NewGuid(),
                    LoanId = request.LoanId,
                    UserId = loan.UserId,
                    Amount = Money.FromKes(request.AmountKes),
                    Method = PaymentMethod.mpesa,
                    Status = PaymentStatus.pending,
                    PhoneNumberUsed = request.PhoneNumber,
                    RequestSentAt = DateTime.UtcNow
                };

                _dbContext.Payments.Add(payment);
                await _dbContext.SaveChangesAsync();

                // Initiate STK Push
                var result = await _mpesaService.InitiateStkPushAsync(request);

                if (result.Success)
                {
                    payment.MpesaRequestId = result.MerchantRequestId;
                    payment.MpesaCheckoutRequestId = result.CheckoutRequestId;
                    await _dbContext.SaveChangesAsync();
                }
                else
                {
                    payment.Status = PaymentStatus.failed;
                    payment.MpesaResultDesc = result.ResponseDescription;
                    await _dbContext.SaveChangesAsync();
                }

                return Ok(ApiResponse<MpesaStkPushResponseDto>.Ok(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating STK Push");
                return StatusCode(500, ApiResponse<MpesaStkPushResponseDto>.Error(
                    "An error occurred while initiating payment"));
            }
        }

        /// <summary>
        /// M-Pesa callback endpoint (webhook)
        /// This endpoint receives payment confirmations from Safaricom
        /// </summary>
        [HttpPost("mpesa/callback")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> MpesaCallback([FromBody] MpesaCallbackRequestDto callback)
        {
            try
            {
                _logger.LogInformation("Received M-Pesa callback: {CheckoutRequestId}",
                    callback.Body.StkCallback.CheckoutRequestID);

                var success = await _mpesaService.ProcessCallbackAsync(callback);

                if (success)
                {
                    // Update payment record if exists
                    var checkoutRequestId = callback.Body.StkCallback.CheckoutRequestID;
                    var payment = await _dbContext.Payments
                        .FirstOrDefaultAsync(p => p.MpesaCheckoutRequestId == checkoutRequestId);

                    if (payment != null)
                    {
                        if (callback.Body.StkCallback.ResultCode == 0)
                        {
                            payment.Status = PaymentStatus.completed;
                            payment.CompletedAt = DateTime.UtcNow;
                            
                            // Update loan
                            var loan = await _dbContext.Loans.FindAsync(payment.LoanId);
                            if (loan != null)
                            {
                                loan.TotalPaid = loan.TotalPaid + payment.Amount;
                                loan.BalanceDue = loan.BalanceDue - payment.Amount;
                                _dbContext.Loans.Update(loan);
                            }
                        }
                        else
                        {
                            payment.Status = PaymentStatus.failed;
                            payment.MpesaResultCode = callback.Body.StkCallback.ResultCode.ToString();
                            payment.MpesaResultDesc = callback.Body.StkCallback.ResultDesc;
                        }

                        await _dbContext.SaveChangesAsync();
                    }

                    return Ok();
                }

                return StatusCode(500, "Error processing callback");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing M-Pesa callback");
                // Always return 200 to M-Pesa to prevent retries
                return Ok();
            }
        }

        /// <summary>
        /// Initiate M-Pesa B2C payment (refund/disbursement)
        /// Admin only
        /// </summary>
        [HttpPost("mpesa/b2c")]
        [Authorize(Roles = "admin")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<bool>>> SendB2C(
            [FromBody] MpesaStkPushRequestDto request)
        {
            try
            {
                var result = await _mpesaService.SendB2CAsync(
                    request.PhoneNumber,
                    request.AmountKes,
                    $"Refund for Loan {request.LoanId}");

                if (result)
                {
                    return Ok(ApiResponse<bool>.Ok(true, "B2C payment initiated"));
                }

                return BadRequest(ApiResponse<bool>.Error("Failed to initiate B2C payment"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating B2C payment");
                return StatusCode(500, ApiResponse<bool>.Error(
                    "An error occurred while initiating B2C payment"));
            }
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        private static PaymentResponseDto MapToDto(Payment payment)
        {
            return new PaymentResponseDto
            {
                PaymentId = payment.PaymentId,
                LoanId = payment.LoanId,
                Amount = payment.Amount.ToString(),
                Method = payment.Method.ToString(),
                Status = payment.Status.ToString(),
                MpesaReceiptNumber = payment.MpesaReceiptNumber,
                PhoneNumberUsed = payment.PhoneNumberUsed,
                CompletedAt = payment.CompletedAt,
                CreatedAt = payment.CreatedAt
            };
        }
    }
}
