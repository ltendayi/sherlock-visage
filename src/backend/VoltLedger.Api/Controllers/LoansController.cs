using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltLedger.Api.Data;
using VoltLedger.Api.DTOs;
using VoltLedger.Api.Models;

namespace VoltLedger.Api.Controllers
{
    /// <summary>
    /// Loan management controller for e-bike rentals
    /// Implements RLS-aware queries for county-based access
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class LoansController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ILogger<LoansController> _logger;

        public LoansController(ApplicationDbContext dbContext, ILogger<LoansController> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Get all loans with optional filtering
        /// Agents can only see loans in their county
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "admin,agent")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<LoanResponseDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<PagedResult<LoanResponseDto>>>> GetLoans(
            [FromQuery] LoanFilterDto filter)
        {
            try
            {
                var query = _dbContext.Loans
                    .Include(l => l.User)
                    .Include(l => l.Bike)
                    .AsQueryable();

                // Apply RLS - Filter by county for agents
                if (User.IsInRole("agent") && !User.IsInRole("admin"))
                {
                    var county = User.FindFirst("county")?.Value;
                    if (!string.IsNullOrEmpty(county))
                    {
                        query = query.Where(l => l.User != null && l.User.HomeCounty == county);
                    }
                }

                // Apply filters
                if (filter.Status.HasValue)
                    query = query.Where(l => l.Status == filter.Status.Value);

                if (filter.UserId.HasValue)
                    query = query.Where(l => l.UserId == filter.UserId.Value);

                if (filter.BikeId.HasValue)
                    query = query.Where(l => l.BikeId == filter.BikeId.Value);

                if (!string.IsNullOrEmpty(filter.County))
                    query = query.Where(l => l.User != null && l.User.HomeCounty == filter.County);

                if (filter.StartDateFrom.HasValue)
                    query = query.Where(l => l.StartDate >= filter.StartDateFrom.Value);

                if (filter.StartDateTo.HasValue)
                    query = query.Where(l => l.StartDate <= filter.StartDateTo.Value);

                if (filter.IsOverdue.HasValue)
                {
                    if (filter.IsOverdue.Value)
                        query = query.Where(l => l.Status == LoanStatus.overdue);
                    else
                        query = query.Where(l => l.Status != LoanStatus.overdue);
                }

                // Order and paginate
                var totalCount = await query.CountAsync();
                var loans = await query
                    .OrderByDescending(l => l.CreatedAt)
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();

                var result = new PagedResult<LoanResponseDto>
                {
                    Items = loans.Select(MapToDto).ToList(),
                    TotalCount = totalCount,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize
                };

                return Ok(ApiResponse<PagedResult<LoanResponseDto>>.Ok(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving loans");
                return StatusCode(500, ApiResponse<PagedResult<LoanResponseDto>>.Error(
                    "An error occurred while retrieving loans"));
            }
        }

        /// <summary>
        /// Get loan by ID
        /// Users can only see their own loans
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<LoanResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<LoanResponseDto>>> GetLoan(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var isAdmin = User.IsInRole("admin");
                var isAgent = User.IsInRole("agent");

                var loan = await _dbContext.Loans
                    .Include(l => l.User)
                    .Include(l => l.Bike)
                    .FirstOrDefaultAsync(l => l.LoanId == id);

                if (loan == null)
                    return NotFound(ApiResponse<LoanResponseDto>.NotFound("Loan not found"));

                // RLS check - Users can only see their own loans
                if (!isAdmin && loan.UserId != userId)
                {
                    // Agents can see loans in their county
                    if (isAgent)
                    {
                        var county = User.FindFirst("county")?.Value;
                        if (loan.User?.HomeCounty != county)
                        {
                            return NotFound(ApiResponse<LoanResponseDto>.NotFound());
                        }
                    }
                    else
                    {
                        return NotFound(ApiResponse<LoanResponseDto>.NotFound());
                    }
                }

                return Ok(ApiResponse<LoanResponseDto>.Ok(MapToDto(loan)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving loan {LoanId}", id);
                return StatusCode(500, ApiResponse<LoanResponseDto>.Error(
                    "An error occurred while retrieving loan"));
            }
        }

        /// <summary>
        /// Get current user's loans
        /// </summary>
        [HttpGet("my-loans")]
        [ProducesResponseType(typeof(ApiResponse<List<LoanResponseDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<List<LoanResponseDto>>>> GetMyLoans()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(ApiResponse<List<LoanResponseDto>>.Unauthorized());

                var loans = await _dbContext.Loans
                    .Include(l => l.Bike)
                    .Where(l => l.UserId == userId)
                    .OrderByDescending(l => l.CreatedAt)
                    .ToListAsync();

                return Ok(ApiResponse<List<LoanResponseDto>>.Ok(
                    loans.Select(MapToDto).ToList()));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user loans");
                return StatusCode(500, ApiResponse<List<LoanResponseDto>>.Error(
                    "An error occurred while retrieving loans"));
            }
        }

        /// <summary>
        /// Create a new loan
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<LoanResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<LoanResponseDto>>> CreateLoan(
            [FromBody] CreateLoanRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(ApiResponse<LoanResponseDto>.Unauthorized());

                // Verify bike exists and is available
                var bike = await _dbContext.EBikes.FindAsync(request.BikeId);
                if (bike == null)
                    return BadRequest(ApiResponse<LoanResponseDto>.Error("Bike not found"));

                if (bike.Status != BikeStatus.available)
                    return BadRequest(ApiResponse<LoanResponseDto>.Error("Bike is not available for rental"));

                // Verify user doesn't have active loan on this bike
                var existingLoan = await _dbContext.Loans
                    .FirstOrDefaultAsync(l => l.UserId == userId && 
                        l.BikeId == request.BikeId && 
                        (l.Status == LoanStatus.active || l.Status == LoanStatus.pending));

                if (existingLoan != null)
                    return BadRequest(ApiResponse<LoanResponseDto>.Error(
                        "You already have an active loan for this bike"));

                // Calculate loan terms
                var user = await _dbContext.Users.FindAsync(userId);
                var dailyRate = bike.DailyRate;
                int? totalDays = request.EndDate.HasValue 
                    ? (int)(request.EndDate.Value - request.StartDate).TotalDays + 1 
                    : null;
                var estimatedTotal = totalDays.HasValue ? dailyRate * totalDays.Value : null;

                var loan = new Loan
                {
                    LoanId = Guid.NewGuid(),
                    UserId = userId.Value,
                    BikeId = request.BikeId,
                    Status = LoanStatus.pending,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    ExpectedReturnDate = request.EndDate,
                    DailyRate = dailyRate,
                    DepositAmount = bike.DepositAmount,
                    TotalDays = totalDays,
                    EstimatedTotal = estimatedTotal,
                    PickupLocationId = request.PickupLocationId,
                    TermsAccepted = request.TermsAccepted,
                    TermsAcceptedAt = request.TermsAccepted ? DateTime.UtcNow : null
                };

                _dbContext.Loans.Add(loan);
                
                // Update bike status
                bike.Status = BikeStatus.rented;
                _dbContext.EBikes.Update(bike);

                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Loan created: {LoanId} for User: {UserId}", loan.LoanId, userId);

                return CreatedAtAction(nameof(GetLoan), new { id = loan.LoanId },
                    ApiResponse<LoanResponseDto>.Created(MapToDto(loan), "Loan created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating loan");
                return StatusCode(500, ApiResponse<LoanResponseDto>.Error(
                    "An error occurred while creating loan"));
            }
        }

        /// <summary>
        /// Update loan status (Admin/Agent only)
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "admin,agent")]
        [ProducesResponseType(typeof(ApiResponse<LoanResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<LoanResponseDto>>> UpdateStatus(
            Guid id, [FromBody] UpdateLoanStatusRequestDto request)
        {
            try
            {
                var loan = await _dbContext.Loans
                    .Include(l => l.User)
                    .Include(l => l.Bike)
                    .FirstOrDefaultAsync(l => l.LoanId == id);

                if (loan == null)
                    return NotFound(ApiResponse<LoanResponseDto>.NotFound("Loan not found"));

                // RLS check for agents
                if (User.IsInRole("agent") && !User.IsInRole("admin"))
                {
                    var county = User.FindFirst("county")?.Value;
                    if (loan.User?.HomeCounty != county)
                    {
                        return NotFound(ApiResponse<LoanResponseDto>.NotFound());
                    }
                }

                loan.Status = request.Status;
                loan.UpdatedAt = DateTime.UtcNow;

                // Update bike status based on loan status
                if (request.Status == LoanStatus.completed || request.Status == LoanStatus.cancelled)
                {
                    var bike = await _dbContext.EBikes.FindAsync(loan.BikeId);
                    if (bike != null)
                    {
                        bike.Status = BikeStatus.available;
                        _dbContext.EBikes.Update(bike);
                    }
                }

                _dbContext.Loans.Update(loan);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Loan {LoanId} status updated to {Status}", id, request.Status);

                return Ok(ApiResponse<LoanResponseDto>.Ok(MapToDto(loan), "Status updated"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating loan status {LoanId}", id);
                return StatusCode(500, ApiResponse<LoanResponseDto>.Error(
                    "An error occurred while updating loan status"));
            }
        }

        /// <summary>
        /// Return a bike and complete the loan
        /// </summary>
        [HttpPost("{id}/return")]
        [ProducesResponseType(typeof(ApiResponse<LoanResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<LoanResponseDto>>> ReturnBike(
            Guid id, [FromBody] ReturnBikeRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(ApiResponse<LoanResponseDto>.Unauthorized());

                var loan = await _dbContext.Loans
                    .Include(l => l.Bike)
                    .FirstOrDefaultAsync(l => l.LoanId == id);

                if (loan == null)
                    return NotFound(ApiResponse<LoanResponseDto>.NotFound("Loan not found"));

                // Check ownership
                if (loan.UserId != userId && !User.IsInRole("admin") && !User.IsInRole("agent"))
                    return Forbid();

                if (loan.Status != LoanStatus.active && loan.Status != LoanStatus.overdue)
                    return BadRequest(ApiResponse<LoanResponseDto>.Error("Loan cannot be returned"));

                loan.Status = LoanStatus.completed;
                loan.ActualReturnDate = DateTime.UtcNow;
                loan.ReturnLocationId = request.ReturnLocationId;
                loan.UpdatedAt = DateTime.UtcNow;

                // Update bike status
                if (loan.Bike != null)
                {
                    loan.Bike.Status = BikeStatus.available;
                    if (request.FinalBatteryPct.HasValue)
                        loan.Bike.CurrentBatteryPct = request.FinalBatteryPct.Value;
                }

                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Bike returned for loan {LoanId}", id);

                return Ok(ApiResponse<LoanResponseDto>.Ok(MapToDto(loan), "Bike returned successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error returning bike for loan {LoanId}", id);
                return StatusCode(500, ApiResponse<LoanResponseDto>.Error(
                    "An error occurred while returning bike"));
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

        private static LoanResponseDto MapToDto(Loan loan)
        {
            return new LoanResponseDto
            {
                LoanId = loan.LoanId,
                UserId = loan.UserId,
                User = loan.User != null ? new UserDto
                {
                    UserId = loan.User.UserId,
                    PhoneNumber = loan.User.PhoneNumber,
                    FullName = loan.User.FullName,
                    Role = loan.User.Role.ToString(),
                    PhoneVerified = loan.User.PhoneVerified,
                    HomeCounty = loan.User.HomeCounty,
                    CreatedAt = loan.User.CreatedAt
                } : null,
                BikeId = loan.BikeId,
                Bike = loan.Bike != null ? new EBikeSimpleDto
                {
                    BikeId = loan.Bike.BikeId,
                    SerialNumber = loan.Bike.SerialNumber,
                    Model = loan.Bike.Model,
                    Status = loan.Bike.Status.ToString()
                } : null,
                Status = loan.Status.ToString(),
                StartDate = loan.StartDate,
                EndDate = loan.EndDate,
                ExpectedReturnDate = loan.ExpectedReturnDate,
                ActualReturnDate = loan.ActualReturnDate,
                DailyRate = loan.DailyRate.ToString(),
                TotalPaid = loan.TotalPaid.ToString(),
                BalanceDue = loan.BalanceDue.ToString(),
                LateFee = loan.LateFee.ToString(),
                CreatedAt = loan.CreatedAt
            };
        }
    }
}
