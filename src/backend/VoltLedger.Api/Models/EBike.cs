using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum BikeStatus
    {
        available,
        rented,
        maintenance,
        retired
    }

    public enum IoTStatus
    {
        online,
        offline,
        maintenance
    }

    /// <summary>
    /// EBike entity with IoT tracking capabilities
    /// </summary>
    [Table("e_bikes")]
    public class EBike
    {
        [Key]
        [Column("bike_id")]
        public Guid BikeId { get; set; } = Guid.NewGuid();
        
        [Column("location_id")]
        public Guid? LocationId { get; set; }
        
        // Hardware details
        [Required]
        [Column("serial_number")]
        [StringLength(50)]
        public string SerialNumber { get; set; } = string.Empty;
        
        [Required]
        [Column("model")]
        [StringLength(50)]
        public string Model { get; set; } = string.Empty;
        
        [Column("manufacturer")]
        [StringLength(50)]
        public string? Manufacturer { get; set; }
        
        [Column("year_manufactured")]
        public int? YearManufactured { get; set; }
        
        // Battery specifications
        [Column("battery_capacity_kwh")]
        public decimal? BatteryCapacityKwh { get; set; }
        
        [Column("battery_cycles")]
        public int BatteryCycles { get; set; } = 0;
        
        [Column("current_battery_pct")]
        [Range(0, 100)]
        public int? CurrentBatteryPct { get; set; }
        
        // IoT/Tracking
        [Column("imei")]
        [StringLength(20)]
        public string? Imei { get; set; }
        
        [Column("iot_status")]
        public IoTStatus IoTStatus { get; set; } = IoTStatus.offline;
        
        [Column("last_seen_at")]
        public DateTime? LastSeenAt { get; set; }
        
        [Column("last_gps")]
        [JsonPropertyName("last_gps")]
        public string? LastGpsJson { get; set; }
        
        // Business logic
        [Column("status")]
        public BikeStatus Status { get; set; } = BikeStatus.available;
        
        /// <summary>
        /// Daily rental rate in Kenyan Shillings (stored as cents internally)
        /// </summary>
        [Column("daily_rate_kes")]
        public int DailyRateKes { get; set; }
        
        [NotMapped]
        public Money DailyRate 
        { 
            get => new Money(DailyRateKes);
            set => DailyRateKes = (int)value.Cents;
        }
        
        [Column("deposit_required")]
        public bool DepositRequired { get; set; } = true;
        
        [Column("deposit_amount_kes")]
        public int DepositAmountKes { get; set; } = 200000; // 2000 KES in cents
        
        [NotMapped]
        public Money DepositAmount
        {
            get => new Money(DepositAmountKes);
            set => DepositAmountKes = (int)value.Cents;
        }
        
        // Flexible storage
        [Column("specs")]
        [JsonPropertyName("specs")]
        public string? SpecsJson { get; set; } = "{}";
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("LocationId")]
        public virtual Location? Location { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Loan>? Loans { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Maintenance>? MaintenanceRecords { get; set; }
        
        [JsonIgnore]
        public virtual BikeHealth? BikeHealth { get; set; }
    }
}
