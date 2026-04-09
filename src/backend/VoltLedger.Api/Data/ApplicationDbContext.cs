using Microsoft.EntityFrameworkCore;
using VoltLedger.Api.Models;

namespace VoltLedger.Api.Data
{
    /// <summary>
    /// Entity Framework Core DbContext for VoltLedger
    /// Configured for PostgreSQL with Npgsql
    /// </summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
            : base(options)
        {
        }

        // Core entities
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Location> Locations { get; set; } = null!;
        public DbSet<EBike> EBikes { get; set; } = null!;
        public DbSet<Loan> Loans { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<Transaction> Transactions { get; set; } = null!;
        public DbSet<Maintenance> Maintenance { get; set; } = null!;
        public DbSet<BikeHealth> BikeHealth { get; set; } = null!;
        
        // Audit and compliance
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        
        // M-Pesa integration
        public DbSet<MpesaCallback> MpesaCallbacks { get; set; } = null!;
        public DbSet<MpesaReconciliation> MpesaReconciliations { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure PostgreSQL-specific features and enums
            modelBuilder.HasPostgresEnum<UserRole>();
            modelBuilder.HasPostgresEnum<UserRole>("user_role");
            modelBuilder.HasPostgresEnum<BikeStatus>();
            modelBuilder.HasPostgresEnum<IoTStatus>();
            modelBuilder.HasPostgresEnum<LoanStatus>();
            modelBuilder.HasPostgresEnum<PaymentMethod>();
            modelBuilder.HasPostgresEnum<PaymentStatus>();
            modelBuilder.HasPostgresEnum<TransactionType>();
            modelBuilder.HasPostgresEnum<TransactionStatus>();
            modelBuilder.HasPostgresEnum<TransactionDirection>();
            modelBuilder.HasPostgresEnum<HubType>();
            modelBuilder.HasPostgresEnum<MaintenancePriority>();
            modelBuilder.HasPostgresEnum<MaintenanceStatus>();
            modelBuilder.HasPostgresEnum<HealthStatus>();
            modelBuilder.HasPostgresEnum<AuditAction>();
            modelBuilder.HasPostgresEnum<ReconciliationStatus>();

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.PhoneNumber).IsUnique();
                entity.HasIndex(e => e.IdNumber).IsUnique();
                entity.HasIndex(e => e.HomeCounty);
                entity.HasIndex(e => e.Role);
                entity.HasIndex(e => e.PhoneVerified);
                
                // Check constraint for phone number format
                entity.HasCheckConstraint("CHK_User_PhoneFormat", "phone_number ~ '^254[0-9]{9}$'");
                
                // Check constraint for GPS retention
                entity.HasCheckConstraint("CHK_User_GPSRetention", "gps_retention_days BETWEEN 1 AND 90");
                entity.HasCheckConstraint("CHK_User_IoTRetention", "iot_retention_days BETWEEN 1 AND 30");
            });

            // Location configuration
            modelBuilder.Entity<Location>(entity =>
            {
                entity.HasIndex(e => e.Code).IsUnique();
                entity.HasIndex(e => e.County);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => new { e.GpsLatitude, e.GpsLongitude });
            });

            // EBike configuration
            modelBuilder.Entity<EBike>(entity =>
            {
                entity.HasIndex(e => e.SerialNumber).IsUnique();
                entity.HasIndex(e => e.Imei).IsUnique();
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.LocationId);
                entity.HasIndex(e => e.IoTStatus);
                entity.HasIndex(e => new { e.Status, e.LocationId });
                
                // Check constraint for battery percentage
                entity.HasCheckConstraint("CHK_EBike_BatteryPct", "current_battery_pct BETWEEN 0 AND 100");
            });

            // Loan configuration
            modelBuilder.Entity<Loan>(entity =>
            {
                entity.HasIndex(e => new { e.Status, e.UserId });
                entity.HasIndex(e => e.StartDate);
                entity.HasIndex(e => new { e.BikeId, e.Status });
                entity.HasIndex(e => e.UserId);
                
                entity.HasCheckConstraint("CHK_Loan_Dates", "end_date IS NULL OR end_date >= start_date");
            });

            // Payment configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasIndex(e => e.MpesaReceiptNumber)
                    .HasFilter("mpesa_receipt_number IS NOT NULL");
                entity.HasIndex(e => e.MpesaCheckoutRequestId);
                entity.HasIndex(e => e.PhoneNumberUsed);
                entity.HasIndex(e => new { e.LoanId, e.Status });
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.CreatedAt);
                
                // Foreign key to MpesaCallback (from fixes)
                entity.HasOne<MpesaCallback>()
                    .WithMany(m => m.Payments)
                    .HasForeignKey(e => e.MpesaCheckoutRequestId)
                    .HasPrincipalKey(m => m.CheckoutRequestId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Transaction configuration
            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.HasIndex(e => new { e.UserId, e.CreatedAt });
                entity.HasIndex(e => new { e.Type, e.CreatedAt })
                    .HasFilter("status = 'completed'");
                entity.HasIndex(e => e.LoanId);
                entity.HasIndex(e => e.PaymentId);
            });

            // Maintenance configuration
            modelBuilder.Entity<Maintenance>(entity =>
            {
                entity.HasIndex(e => e.BikeId);
                entity.HasIndex(e => new { e.Status, e.Priority });
                entity.HasIndex(e => e.ScheduledAt);
                entity.HasIndex(e => e.CompletedAt);
            });

            // BikeHealth configuration
            modelBuilder.Entity<BikeHealth>(entity =>
            {
                entity.HasIndex(e => e.BikeId).IsUnique();
                entity.HasIndex(e => e.NextInspectionDue);
                entity.HasIndex(e => e.LastInspectionAt);
                
                entity.HasCheckConstraint("CHK_BikeHealth_Battery", "battery_percentage BETWEEN 0 AND 100");
            });

            // AuditLog configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasIndex(e => e.PerformedAt);
                entity.HasIndex(e => new { e.TableName, e.RecordId });
                entity.HasIndex(e => e.PerformedBy);
                
                // Partition hint for future partitioning
                entity.HasAnnotation("PartitionBy", "performed_at");
            });

            // MpesaCallback configuration
            modelBuilder.Entity<MpesaCallback>(entity =>
            {
                entity.HasIndex(e => e.CheckoutRequestId).IsUnique();
                entity.HasIndex(e => e.MpesaReceiptNumber);
                entity.HasIndex(e => e.PhoneNumber);
                entity.HasIndex(e => e.Processed);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.ResultCode);
            });

            // MpesaReconciliation configuration
            modelBuilder.Entity<MpesaReconciliation>(entity =>
            {
                entity.HasIndex(e => e.SettlementDate);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => new { e.SettlementDate, e.Status });
            });
        }
    }
}
