using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum HealthStatus
    {
        excellent,
        good,
        fair,
        poor,
        critical
    }

    /// <summary>
    /// Current health status of an e-bike
    /// </summary>
    [Table("bike_health")]
    public class BikeHealth
    {
        [Key]
        [Column("health_id")]
        public Guid HealthId { get; set; } = Guid.NewGuid();
        
        [Required]
        [Column("bike_id")]
        public Guid BikeId { get; set; }
        
        // Current status
        [Column("battery_percentage")]
        [Range(0, 100)]
        public int? BatteryPercentage { get; set; }
        
        [Column("estimated_range_km")]
        public int? EstimatedRangeKm { get; set; }
        
        [Column("motor_status")]
        public HealthStatus? MotorStatus { get; set; }
        
        [Column("brake_health")]
        public HealthStatus? BrakeHealth { get; set; }
        
        [Column("tire_health")]
        public HealthStatus? TireHealth { get; set; }
        
        [Column("frame_status")]
        [StringLength(20)]
        public string? FrameStatus { get; set; } = "good";
        
        // Alerts
        [Column("active_alerts")]
        [JsonPropertyName("active_alerts")]
        public string? ActiveAlertsJson { get; set; } = "[]";
        
        // History
        [Column("last_inspection_at")]
        public DateTime? LastInspectionAt { get; set; }
        
        [Column("last_inspection_by")]
        public Guid? LastInspectionBy { get; set; }
        
        [Column("next_inspection_due")]
        public DateTime? NextInspectionDue { get; set; }
        
        [Column("total_distance_km")]
        public int TotalDistanceKm { get; set; } = 0;
        
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("BikeId")]
        public virtual EBike? Bike { get; set; }
        
        [ForeignKey("LastInspectionBy")]
        public virtual User? LastInspector { get; set; }
    }
}
