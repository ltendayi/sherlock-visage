using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum PaymentMethod
    {
        mpesa,
        cash,
        bank_transfer,
        wallet_credit
    }

    public enum PaymentStatus
    {
        pending,
        processing,
        completed,
        failed,
        refunded
    }

    /// <summary>
    /// Payment entity with M-Pesa integration support
    /// </summary>
    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("payment_id")]
        public Guid PaymentId { get; set; } = Guid.NewGuid();
        
        [Required]
        [Column("loan_id")]
        public Guid LoanId { get; set; }
        
        [Required]
        [Column("user_id")]
        public Guid UserId { get; set; }
        
        // Payment details (stored as cents)
        [Column("amount_kes")]
        public int AmountKes { get; set; }
        
        [NotMapped]
        public Money Amount
        {
            get => new Money(AmountKes);
            set => AmountKes = (int)value.Cents;
        }
        
        [Column("method")]
        public PaymentMethod Method { get; set; } = PaymentMethod.mpesa;
        
        [Column("status")]
        public PaymentStatus Status { get; set; } = PaymentStatus.pending;
        
        // M-Pesa specific
        [Column("mpesa_request_id")]
        [StringLength(50)]
        public string? MpesaRequestId { get; set; }
        
        [Column("mpesa_receipt_number")]
        [StringLength(50)]
        public string? MpesaReceiptNumber { get; set; }
        
        [Column("mpesa_checkout_request_id")]
        [StringLength(70)]
        public string? MpesaCheckoutRequestId { get; set; }
        
        [Column("phone_number_used")]
        [StringLength(15)]
        public string? PhoneNumberUsed { get; set; }
        
        [Column("mpesa_result_code")]
        [StringLength(10)]
        public string? MpesaResultCode { get; set; }
        
        [Column("mpesa_result_desc")]
        public string? MpesaResultDesc { get; set; }
        
        // Timing
        [Column("request_sent_at")]
        public DateTime? RequestSentAt { get; set; }
        
        [Column("completed_at")]
        public DateTime? CompletedAt { get; set; }
        
        // References
        [Column("collected_by")]
        public Guid? CollectedBy { get; set; }
        
        [Column("collection_location_id")]
        public Guid? CollectionLocationId { get; set; }
        
        // Audit
        [Column("metadata")]
        [JsonPropertyName("metadata")]
        public string? MetadataJson { get; set; } = "{}";
        
        [Column("retry_count")]
        public int RetryCount { get; set; } = 0;
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("LoanId")]
        public virtual Loan? Loan { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        [ForeignKey("CollectedBy")]
        public virtual User? Collector { get; set; }
        
        [ForeignKey("CollectionLocationId")]
        public virtual Location? CollectionLocation { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Transaction>? Transactions { get; set; }
    }
}
