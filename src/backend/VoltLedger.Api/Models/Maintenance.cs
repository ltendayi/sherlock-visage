using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VoltLedger.Api.Models
{
    public enum MaintenancePriority
    {
        low,
        medium,
        high,
        critical
    }

    public enum MaintenanceStatus
    {
        scheduled,
        in_progress,
        completed,
        cancelled
    }

    /// <summary>
    /// Maintenance record for e-bikes
    /// </summary>
    [Table("maintenance")]
    public class Maintenance
    {
        [Key]
        [Column("maint_id")]
        public Guid MaintenanceId { get; set; } = Guid.NewGuid();
        
        [Required]
        [Column("bike_id")]
        public Guid BikeId { get; set; }
        
        [Column("scheduled_by")]
        public Guid? ScheduledBy { get; set; }
        
        [Column("completed_by")]
        public Guid? CompletedBy { get; set; }
        
        // Maintenance details
        [Required]
        [Column("type")]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // 'routine', 'repair', 'battery_replacement'
        
        [Column("priority")]
        public MaintenancePriority Priority { get; set; } = MaintenancePriority.medium;
        
        [Column("description")]
        public string? Description { get; set; }
        
        // Scheduling
        [Column("scheduled_at")]
        public DateTime? ScheduledAt { get; set; }
        
        [Column("completed_at")]
        public DateTime? CompletedAt { get; set; }
        
        [Column("expected_duration_hours")]
        public int? ExpectedDurationHours { get; set; }
        
        // Costs (stored as cents)
        [Column("parts_cost_kes")]
        public int PartsCostKes { get; set; } = 0;
        
        [NotMapped]
        public Money PartsCost
        {
            get => new Money(PartsCostKes);
            set => PartsCostKes = (int)value.Cents;
        }
        
        [Column("labor_cost_kes")]
        public int LaborCostKes { get; set; } = 0;
        
        [NotMapped]
        public Money LaborCost
        {
            get => new Money(LaborCostKes);
            set => LaborCostKes = (int)value.Cents;
        }
        
        [Column("total_cost_kes")]
        public int TotalCostKes { get; set; } = 0;
        
        [NotMapped]
        public Money TotalCost
        {
            get => new Money(TotalCostKes);
            set => TotalCostKes = (int)value.Cents;
        }
        
        // Results
        [Column("findings")]
        public string? Findings { get; set; }
        
        [Column("actions_taken")]
        public string? ActionsTaken { get; set; }
        
        [Column("parts_used")]
        [JsonPropertyName("parts_used")]
        public string? PartsUsedJson { get; set; } = "[]";
        
        // Status
        [Column("status")]
        public MaintenanceStatus Status { get; set; } = MaintenanceStatus.scheduled;
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("BikeId")]
        public virtual EBike? Bike { get; set; }
        
        [ForeignKey("ScheduledBy")]
        public virtual User? Scheduler { get; set; }
        
        [ForeignKey("CompletedBy")]
        public virtual User? Completer { get; set; }
    }
}
