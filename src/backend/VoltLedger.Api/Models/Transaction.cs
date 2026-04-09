using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum TransactionType
    {
        deposit,
        rental_payment,
        late_fee,
        damage_charge,
        refund,
        topup,
        withdrawal
    }

    public enum TransactionStatus
    {
        pending,
        completed,
        reversed
    }

    public enum TransactionDirection
    {
        credit,
        debit
    }

    /// <summary>
    /// Financial transaction ledger - immutable record
    /// </summary>
    [Table("transactions")]
    public class Transaction
    {
        [Key]
        [Column("txn_id")]
        public Guid TransactionId { get; set; } = Guid.NewGuid();
        
        [Column("loan_id")]
        public Guid? LoanId { get; set; }
        
        [Column("user_id")]
        public Guid? UserId { get; set; }
        
        [Column("bike_id")]
        public Guid? BikeId { get; set; }
        
        // Transaction details
        [Required]
        [Column("type")]
        public TransactionType Type { get; set; }
        
        [Column("amount_kes")]
        public int AmountKes { get; set; }
        
        [NotMapped]
        public Money Amount
        {
            get => new Money(AmountKes);
            set => AmountKes = (int)value.Cents;
        }
        
        [Column("direction")]
        public TransactionDirection Direction { get; set; }
        
        // References
        [Column("payment_id")]
        public Guid? PaymentId { get; set; }
        
        [Column("related_txn_id")]
        public Guid? RelatedTransactionId { get; set; }
        
        // Status
        [Column("status")]
        public TransactionStatus Status { get; set; } = TransactionStatus.completed;
        
        // Description
        [Column("description")]
        public string? Description { get; set; }
        
        [Column("metadata")]
        [JsonPropertyName("metadata")]
        public string? MetadataJson { get; set; } = "{}";
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("created_by")]
        public Guid? CreatedBy { get; set; }
        
        // Navigation properties
        [ForeignKey("LoanId")]
        public virtual Loan? Loan { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        [ForeignKey("BikeId")]
        public virtual EBike? Bike { get; set; }
        
        [ForeignKey("PaymentId")]
        public virtual Payment? Payment { get; set; }
        
        [ForeignKey("RelatedTransactionId")]
        public virtual Transaction? RelatedTransaction { get; set; }
    }
}
