using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum AuditAction
    {
        INSERT,
        UPDATE,
        DELETE
    }

    /// <summary>
    /// Audit log for tracking data changes
    /// </summary>
    [Table("audit_logs")]
    public class AuditLog
    {
        [Key]
        [Column("log_id")]
        public long LogId { get; set; }
        
        [Required]
        [Column("table_name")]
        [StringLength(50)]
        public string TableName { get; set; } = string.Empty;
        
        [Required]
        [Column("record_id")]
        public Guid RecordId { get; set; }
        
        [Required]
        [Column("action")]
        public AuditAction Action { get; set; }
        
        // Data tracking
        [Column("old_data")]
        [JsonPropertyName("old_data")]
        public string? OldDataJson { get; set; }
        
        [Column("new_data")]
        [JsonPropertyName("new_data")]
        public string? NewDataJson { get; set; }
        
        [Column("changed_fields")]
        [JsonPropertyName("changed_fields")]
        public string? ChangedFieldsJson { get; set; }
        
        // Who and when
        [Column("performed_by")]
        public Guid? PerformedBy { get; set; }
        
        [Column("performed_at")]
        public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
        
        // Context
        [Column("ip_address")]
        public string? IpAddress { get; set; }
        
        [Column("user_agent")]
        public string? UserAgent { get; set; }
        
        [Column("session_id")]
        public string? SessionId { get; set; }
        
        [Column("request_id")]
        public string? RequestId { get; set; }
        
        // Navigation
        [ForeignKey("PerformedBy")]
        public virtual User? PerformedByUser { get; set; }
    }
}
