using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    /// <summary>
    /// M-Pesa API callback storage per fintech specifications
    /// </summary>
    [Table("mpesa_callbacks")]
    public class MpesaCallback
    {
        [Key]
        [Column("callback_id")]
        public long CallbackId { get; set; }
        
        [Column("merchant_request_id")]
        [StringLength(50)]
        public string? MerchantRequestId { get; set; }
        
        [Column("checkout_request_id")]
        [StringLength(70)]
        public string? CheckoutRequestId { get; set; }
        
        [Column("result_code")]
        public int? ResultCode { get; set; }
        
        [Column("result_desc")]
        public string? ResultDesc { get; set; }
        
        /// <summary>
        /// Amount in cents (INTEGER per fintech fixes)
        /// </summary>
        [Column("amount_cents")]
        public long? AmountCents { get; set; }
        
        [NotMapped]
        public Money? Amount
        {
            get => AmountCents.HasValue ? new Money(AmountCents.Value) : null;
            set => AmountCents = value?.Cents;
        }
        
        [Column("mpesa_receipt_number")]
        [StringLength(50)]
        public string? MpesaReceiptNumber { get; set; }
        
        [Column("transaction_date")]
        public DateTime? TransactionDate { get; set; }
        
        [Column("phone_number")]
        [StringLength(15)]
        public string? PhoneNumber { get; set; }
        
        [Column("raw_payload")]
        [JsonPropertyName("raw_payload")]
        public string RawPayloadJson { get; set; } = "{}";
        
        [Column("processed")]
        public bool Processed { get; set; } = false;
        
        [Column("processed_at")]
        public DateTime? ProcessedAt { get; set; }
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation
        [JsonIgnore]
        public virtual ICollection<Payment>? Payments { get; set; }
    }
}
