using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum LoanStatus
    {
        pending,
        active,
        overdue,
        completed,
        defaulted,
        cancelled
    }

    /// <summary>
    /// Loan entity for e-bike rentals
    /// </summary>
    [Table("loans")]
    public class Loan
    {
        [Key]
        [Column("loan_id")]
        public Guid LoanId { get; set; } = Guid.NewGuid();
        
        [Required]
        [Column("user_id")]
        public Guid UserId { get; set; }
        
        [Required]
        [Column("bike_id")]
        public Guid BikeId { get; set; }
        
        // Loan terms
        [Column("status")]
        public LoanStatus Status { get; set; } = LoanStatus.pending;
        
        [Required]
        [Column("start_date")]
        public DateTime StartDate { get; set; }
        
        [Column("end_date")]
        public DateTime? EndDate { get; set; }
        
        [Column("expected_return_date")]
        public DateTime? ExpectedReturnDate { get; set; }
        
        [Column("actual_return_date")]
        public DateTime? ActualReturnDate { get; set; }
        
        // Financial terms (stored as cents)
        [Column("daily_rate_kes")]
        public int DailyRateKes { get; set; }
        
        [NotMapped]
        public Money DailyRate
        {
            get => new Money(DailyRateKes);
            set => DailyRateKes = (int)value.Cents;
        }
        
        [Column("deposit_amount_kes")]
        public int DepositAmountKes { get; set; } = 0;
        
        [NotMapped]
        public Money DepositAmount
        {
            get => new Money(DepositAmountKes);
            set => DepositAmountKes = (int)value.Cents;
        }
        
        [Column("total_days")]
        public int? TotalDays { get; set; }
        
        [Column("estimated_total_kes")]
        public int? EstimatedTotalKes { get; set; }
        
        [NotMapped]
        public Money? EstimatedTotal
        {
            get => EstimatedTotalKes.HasValue ? new Money(EstimatedTotalKes.Value) : null;
            set => EstimatedTotalKes = value.HasValue ? (int)value.Value.Cents : null;
        }
        
        // Payment tracking
        [Column("total_paid_kes")]
        public int TotalPaidKes { get; set; } = 0;
        
        [NotMapped]
        public Money TotalPaid
        {
            get => new Money(TotalPaidKes);
            set => TotalPaidKes = (int)value.Cents;
        }
        
        [Column("balance_due_kes")]
        public int BalanceDueKes { get; set; } = 0;
        
        [NotMapped]
        public Money BalanceDue
        {
            get => new Money(BalanceDueKes);
            set => BalanceDueKes = (int)value.Cents;
        }
        
        [Column("late_fee_kes")]
        public int LateFeeKes { get; set; } = 0;
        
        [NotMapped]
        public Money LateFee
        {
            get => new Money(LateFeeKes);
            set => LateFeeKes = (int)value.Cents;
        }
        
        // Location tracking
        [Column("pickup_location_id")]
        public Guid? PickupLocationId { get; set; }
        
        [Column("return_location_id")]
        public Guid? ReturnLocationId { get; set; }
        
        // Agreement
        [Column("terms_accepted")]
        public bool TermsAccepted { get; set; } = false;
        
        [Column("terms_accepted_at")]
        public DateTime? TermsAcceptedAt { get; set; }
        
        [Column("contract_photo_url")]
        public string? ContractPhotoUrl { get; set; }
        
        // Flex data
        [Column("rider_notes")]
        [JsonPropertyName("rider_notes")]
        public string? RiderNotesJson { get; set; } = "{}";
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        [ForeignKey("BikeId")]
        public virtual EBike? Bike { get; set; }
        
        [ForeignKey("PickupLocationId")]
        public virtual Location? PickupLocation { get; set; }
        
        [ForeignKey("ReturnLocationId")]
        public virtual Location? ReturnLocation { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Payment>? Payments { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Transaction>? Transactions { get; set; }
    }
}
