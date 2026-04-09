using System.ComponentModel.DataAnnotations;
using VoltLedger.Api.Models;

namespace VoltLedger.Api.DTOs
{
    public class CreateLoanRequestDto
    {
        [Required]
        public Guid BikeId { get; set; }
        
        [Required]
        public DateTime StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        public Guid? PickupLocationId { get; set; }
        
        public bool TermsAccepted { get; set; } = false;
    }

    public class LoanResponseDto
    {
        public Guid LoanId { get; set; }
        public Guid UserId { get; set; }
        public UserDto? User { get; set; }
        public Guid BikeId { get; set; }
        public EBikeSimpleDto? Bike { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? ExpectedReturnDate { get; set; }
        public DateTime? ActualReturnDate { get; set; }
        public string DailyRate { get; set; } = string.Empty;
        public string TotalPaid { get; set; } = string.Empty;
        public string BalanceDue { get; set; } = string.Empty;
        public string LateFee { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class EBikeSimpleDto
    {
        public Guid BikeId { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateLoanStatusRequestDto
    {
        [Required]
        public LoanStatus Status { get; set; }
        
        public string? Notes { get; set; }
    }

    public class ReturnBikeRequestDto
    {
        [Required]
        public Guid ReturnLocationId { get; set; }
        
        public string? ConditionNotes { get; set; }
        
        public int? FinalBatteryPct { get; set; }
    }

    public class LoanFilterDto
    {
        public LoanStatus? Status { get; set; }
        public Guid? UserId { get; set; }
        public Guid? BikeId { get; set; }
        public string? County { get; set; }
        public DateTime? StartDateFrom { get; set; }
        public DateTime? StartDateTo { get; set; }
        public bool? IsOverdue { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
    }
}
