using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum HubType
    {
        station,
        partner_shop,
        mobile_unit
    }

    /// <summary>
    /// Location/Hub entity with Kenyan administrative structure
    /// </summary>
    [Table("locations")]
    public class Location
    {
        [Key]
        [Column("location_id")]
        public Guid LocationId { get; set; } = Guid.NewGuid();
        
        [Required]
        [Column("name")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Column("code")]
        [StringLength(20)]
        public string? Code { get; set; }
        
        // Kenyan administrative structure
        [Required]
        [Column("county")]
        [StringLength(50)]
        public string County { get; set; } = string.Empty;
        
        [Column("sub_county")]
        [StringLength(50)]
        public string? SubCounty { get; set; }
        
        [Column("ward")]
        [StringLength(50)]
        public string? Ward { get; set; }
        
        [Column("constituency")]
        [StringLength(50)]
        public string? Constituency { get; set; }
        
        // GPS coordinates
        [Required]
        [Column("gps_latitude")]
        public decimal GpsLatitude { get; set; }
        
        [Required]
        [Column("gps_longitude")]
        public decimal GpsLongitude { get; set; }
        
        [Column("gps_accuracy_meters")]
        public int? GpsAccuracyMeters { get; set; }
        
        // Hub characteristics
        [Column("hub_type")]
        public HubType HubType { get; set; } = HubType.station;
        
        [Column("is_active")]
        public bool IsActive { get; set; } = true;
        
        [Column("operating_hours")]
        [JsonPropertyName("operating_hours")]
        public string? OperatingHoursJson { get; set; }
        
        // Contact
        [Column("manager_phone")]
        [StringLength(15)]
        public string? ManagerPhone { get; set; }
        
        [Column("manager_name")]
        [StringLength(100)]
        public string? ManagerName { get; set; }
        
        // Capacity
        [Column("max_bikes")]
        public int MaxBikes { get; set; } = 10;
        
        [Column("current_bikes")]
        public int CurrentBikes { get; set; } = 0;
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [JsonIgnore]
        public virtual ICollection<EBike>? EBikes { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Loan>? PickupLoans { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Loan>? ReturnLoans { get; set; }
    }
}
