using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoltLedger.Api.Models
{
    public enum ReconciliationStatus
    {
        pending,
        resolved,
        disputed
    }

    /// <summary>
    /// M-Pesa reconciliation record using INTEGER cents per fintech specs
    /// </summary>
    [Table("mpesa_reconciliation")]
    public class MpesaReconciliation
    {
        [Key]
        [Column("recon_id")]
        public Guid ReconciliationId { get; set; } = Guid.NewGuid();
        
        [Required]
        [Column("settlement_date")]
        public DateTime SettlementDate { get; set; }
        
        [Column("total_transactions")]
        public int? TotalTransactions { get; set; }
        
        /// <summary>
        /// Total amount in cents (INTEGER per fintech fixes)
        /// </summary>
        [Column("total_amount_cents")]
        public long? TotalAmountCents { get; set; }
        
        [NotMapped]
        public Money? TotalAmount
        {
            get => TotalAmountCents.HasValue ? new Money(TotalAmountCents.Value) : null;
            set => TotalAmountCents = value?.Cents;
        }
        
        [Column("mpesa_report_amount_cents")]
        public long? MpesaReportAmountCents { get; set; }
        
        [NotMapped]
        public Money? MpesaReportAmount
        {
            get => MpesaReportAmountCents.HasValue ? new Money(MpesaReportAmountCents.Value) : null;
            set => MpesaReportAmountCents = value?.Cents;
        }
        
        [Column("variance_cents")]
        public long? VarianceCents { get; set; }
        
        [NotMapped]
        public Money? Variance
        {
            get => VarianceCents.HasValue ? new Money(VarianceCents.Value) : null;
            set => VarianceCents = value?.Cents;
        }
        
        [Column("status")]
        public ReconciliationStatus Status { get; set; } = ReconciliationStatus.pending;
        
        [Column("resolved_at")]
        public DateTime? ResolvedAt { get; set; }
        
        [Column("notes")]
        public string? Notes { get; set; }
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
