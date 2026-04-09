using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum UserRole
    {
        rider,
        admin,
        agent,
        mechanic
    }

    /// <summary>
    /// User entity matching SRS schema with Kenyan DPA compliance fields
    /// </summary>
    [Table("users")]
    public class User
    {
        [Key]
        [Column("user_id")]
        public Guid UserId { get; set; } = Guid.NewGuid();
        
        [Required]
        [Column("phone_number")]
        [StringLength(15)]
        [RegularExpression(@"^254[0-9]{9}$", ErrorMessage = "Phone number must be in Kenyan format: 2547XXXXXXXX")]
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        [Column("full_name")]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;
        
        [Column("id_number")]
        [StringLength(20)]
        public string? IdNumber { get; set; }
        
        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }
        
        [Column("role")]
        public UserRole Role { get; set; } = UserRole.rider;
        
        // Kenyan market specific
        [Column("mpesa_consent")]
        public bool MpesaConsent { get; set; } = false;
        
        [Column("phone_verified")]
        public bool PhoneVerified { get; set; } = false;
        
        [Column("id_verified")]
        public bool IdVerified { get; set; } = false;
        
        // DPA Compliance - Consent-based retention
        [Column("gps_tracking_consent")]
        public bool GpsTrackingConsent { get; set; } = false;
        
        [Column("gps_consent_granted_at")]
        public DateTime? GpsConsentGrantedAt { get; set; }
        
        [Column("gps_consent_expires_at")]
        public DateTime? GpsConsentExpiresAt { get; set; }
        
        [Column("gps_retention_days")]
        public int GpsRetentionDays { get; set; } = 14;
        
        [Column("iot_telemetry_consent")]
        public bool IotTelemetryConsent { get; set; } = false;
        
        [Column("iot_consent_granted_at")]
        public DateTime? IotConsentGrantedAt { get; set; }
        
        [Column("iot_retention_days")]
        public int IotRetentionDays { get; set; } = 7;
        
        // Location tracking
        [Column("home_county")]
        [StringLength(50)]
        public string? HomeCounty { get; set; }
        
        [Column("home_ward")]
        [StringLength(50)]
        public string? HomeWard { get; set; }
        
        [Column("current_gps")]
        [JsonPropertyName("current_gps")]
        public string? CurrentGpsJson { get; set; }
        
        // Flexible attributes
        [Column("metadata")]
        [JsonPropertyName("metadata")]
        public string? MetadataJson { get; set; } = "{}";
        
        // Audit fields
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("created_by")]
        public Guid? CreatedBy { get; set; }
        
        // Navigation properties
        [JsonIgnore]
        public virtual ICollection<Loan>? Loans { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Payment>? Payments { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Transaction>? Transactions { get; set; }
    }
}
