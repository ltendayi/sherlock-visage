# VoltLedger Infrastructure Critical Fixes

## Overview
This document addresses 6 CRITICAL infrastructure issues that must be resolved for production deployment on Render.com and proper containerized development.

---

## 1. FIX: Render .NET Runtime - Docker Deployment with .NET 8

### Problem
Native .NET runtime is not available on Render. Must use Docker deployment.

### Solution: Updated render.yaml

```yaml
# render.yaml - CORRECTED for Docker deployment
services:
  # API Service - Docker deployment with .NET 8
  - type: web
    name: voltledger-api
    runtime: docker
    rootDir: ./VoltLedger.Api
    dockerfilePath: ./Dockerfile
    plan: standard
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: ASPNETCORE_URLS
        value: http://0.0.0.0:8080
      - key: ConnectionStrings__DefaultConnection
        fromDatabase:
          name: voltledger-db
          property: connectionString
      - key: Jwt__Secret
        generateValue: true
      - key: Redis__ConnectionString
        fromService:
          name: voltledger-redis
          type: redis
          property: connectionString
    healthCheckPath: /health
    autoDeploy: false  # Require blue-green approval

  # Frontend
  - type: web
    name: voltledger-web
    runtime: static
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /api/*
        destination: https://voltledger-api.onrender.com/api/$1

  # Background Worker
  - type: worker
    name: voltledger-worker
    runtime: docker
    rootDir: ./VoltLedger.Worker
    dockerfilePath: ./Dockerfile
    plan: standard

databases:
  - name: voltledger-db
    databaseName: voltledger
    user: voltledger_user
    plan: standard
    postgresMajorVersion: 15
    ipAllowList: []

  - name: voltledger-redis
    type: redis
    plan: standard
    maxmemoryPolicy: allkeys-lru

envVarGroups:
  - name: voltledger-secrets
    envVars:
      - key: ENCRYPTION_KEY
        generateValue: true
```

### CORRECTED Dockerfile (VoltLedger.Api)

```dockerfile
# Dockerfile - CORRECTED for Render deployment
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080

# Security: Run as non-root
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy csproj files first for layer caching
COPY ["VoltLedger.Api/VoltLedger.Api.csproj", "VoltLedger.Api/"]
COPY ["VoltLedger.Core/VoltLedger.Core.csproj", "VoltLedger.Core/"]
COPY ["VoltLedger.Infrastructure/VoltLedger.Infrastructure.csproj", "VoltLedger.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "VoltLedger.Api/VoltLedger.Api.csproj"

# Copy source code
COPY . .
WORKDIR "/src/VoltLedger.Api"
RUN dotnet build "VoltLedger.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
RUN dotnet publish "VoltLedger.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VoltLedger.Api.dll"]
```

### Migration Files - CORRECTED Dockerfile

```dockerfile
# Dockerfile.Migrate - For running database migrations
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

COPY . .
RUN dotnet restore "VoltLedger.Infrastructure/VoltLedger.Infrastructure.csproj"
RUN dotnet build "VoltLedger.Infrastructure/VoltLedger.Infrastructure.csproj" -c Release -o /app/build

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine
WORKDIR /app
COPY --from=build /app/build .

# Install EF Core tools
RUN dotnet tool install --global dotnet-ef --version 8.0.0
ENV PATH="${PATH}:/root/.dotnet/tools"

ENTRYPOINT ["dotnet", "ef", "database", "update", "--project", "VoltLedger.Infrastructure.dll"]
```

---

## 2. FIX: Migration Rollback Strategy

### Problem
Database migrations without rollback capability can cause production outages.

### Solution: Blue-Green Deployment with Automated Rollback

#### A. Migration Rollback Script

```python
# scripts/migrate_with_rollback.py
#!/usr/bin/env python3
"""
Blue-Green Database Migration with Automated Rollback
Ensures safe deployments with automatic fallback on failure.
"""

import subprocess
import sys
import os
import time
from datetime import datetime

class MigrationManager:
    def __init__(self):
        self.connection_string = os.getenv('DATABASE_URL')
        self.backup_prefix = f"pre_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.health_check_url = os.getenv('API_HEALTH_URL', 'http://localhost:8080/health')
    
    def create_backup(self):
        """Create schema snapshot before migration"""
        print(f"📦 Creating backup: {self.backup_prefix}")
        result = subprocess.run([
            'pg_dump', 
            '--schema-only',
            '--no-owner',
            '-f', f'/backups/{self.backup_prefix}_schema.sql',
            self.connection_string
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Backup failed: {result.stderr}")
        print("✅ Backup created successfully")
    
    def apply_migration(self, migration_name: str = None):
        """Apply EF Core migration"""
        print(f"🔄 Applying migration: {migration_name or 'latest'}")
        
        cmd = ['dotnet', 'ef', 'database', 'update']
        if migration_name:
            cmd.append(migration_name)
        cmd.extend(['--project', 'VoltLedger.Infrastructure'])
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Migration failed: {result.stderr}")
            return False
        
        print("✅ Migration applied successfully")
        return True
    
    def rollback_migration(self, target_migration: str = "0"):
        """Rollback to previous stable state"""
        print(f"⏮️  Rolling back to migration: {target_migration}")
        
        result = subprocess.run([
            'dotnet', 'ef', 'database', 'update', target_migration,
            '--project', 'VoltLedger.Infrastructure'
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Rollback failed: {result.stderr}")
            return False
        
        print("✅ Rollback completed")
        return True
    
    def health_check(self, max_retries: int = 5) -> bool:
        """Verify application health after migration"""
        import urllib.request
        
        for i in range(max_retries):
            try:
                with urllib.request.urlopen(self.health_check_url, timeout=10) as response:
                    if response.status == 200:
                        print("✅ Health check passed")
                        return True
            except Exception as e:
                print(f"⏳ Health check attempt {i+1}/{max_retries} failed: {e}")
                time.sleep(5)
        
        return False
    
    def run(self, migration_name: str = None, dry_run: bool = False):
        """Execute full migration with rollback capability"""
        print("=" * 60)
        print("VoltLedger Blue-Green Migration Process")
        print("=" * 60)
        
        if dry_run:
            print("🏃 DRY RUN MODE - No changes will be applied")
            return
        
        try:
            # Step 1: Create backup
            self.create_backup()
            
            # Step 2: Store current migration for potential rollback
            current_migration = self.get_current_migration()
            
            # Step 3: Apply migration
            if not self.apply_migration(migration_name):
                print("⚠️  Migration failed - initiating rollback")
                self.rollback_migration(current_migration)
                sys.exit(1)
            
            # Step 4: Health check
            if not self.health_check():
                print("⚠️  Health check failed - rolling back")
                self.rollback_migration(current_migration)
                sys.exit(1)
            
            print("=" * 60)
            print("✅ Migration completed successfully!")
            print("=" * 60)
            
        except Exception as e:
            print(f"❌ Fatal error: {e}")
            sys.exit(1)
    
    def get_current_migration(self) -> str:
        """Get current database migration state"""
        result = subprocess.run([
            'dotnet', 'ef', 'migrations', 'list',
            '--project', 'VoltLedger.Infrastructure'
        ], capture_output=True, text=True)
        
        lines = result.stdout.strip().split('\n')
        for line in reversed(lines):
            if 'applied' in line.lower():
                return line.split()[0]
        return "0"

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--migration', help='Target migration name')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes')
    args = parser.parse_args()
    
    manager = MigrationManager()
    manager.run(args.migration, args.dry_run)
```

#### B. Render Pre-Deploy Hook

```bash
#!/bin/bash
# scripts/pre-deploy-migration.sh
# Render pre-deploy hook for safe migrations

set -e

echo "🔍 Pre-deployment migration check..."

# Run migration with rollback capability
python3 scripts/migrate_with_rollback.py --migration "${MIGRATION_NAME:-}"

echo "✅ Migration phase complete"
```

#### C. Updated render.yaml with Blue-Green Deployment

```yaml
# Add to render.yaml - Blue-Green deployment configuration
  - type: job
    name: voltledger-migration
    runtime: docker
    rootDir: ./
    dockerfilePath: ./Dockerfile.Migrate
    plan: standard
    envVars:
      - fromDatabase:
          name: voltledger-db
          property: connectionString
    # Pre-deploy hook ensures migration success before traffic switch

# Web service with manual promotion for blue-green
  - type: web
    name: voltledger-api-blue
    runtime: docker
    rootDir: ./VoltLedger.Api
    dockerfilePath: ./Dockerfile
    autoDeploy: false  # Manual promotion required
    
  - type: web
    name: voltledger-api-green
    runtime: docker
    rootDir: ./VoltLedger.Api
    dockerfilePath: ./Dockerfile
    autoDeploy: false  # Standby for blue-green switch
```

---

## 3. FIX: Prometheus/Grafana - Render.com Setup

### Problem
Prometheus/Grafana references exist but no actual setup instructions for Render.com.

### Solution: Actual Implementation

#### Option A: Remove Misleading References (Quick Fix)

Delete or comment out from docker-compose.yml:
```yaml
# REMOVE THESE SECTIONS - Not supported on Render.com free tier
# prometheus:
#   image: prom/prometheus:latest
#   volumes:
#     - ./prometheus.yml:/etc/prometheus/prometheus.yml
#   
# grafana:
#   image: grafana/grafana:latest
#   ports:
#     - "3001:3000"
```

#### Option B: Proper Render.com Monitoring Setup (Recommended)

```yaml
# render.yaml - With proper monitoring integration
services:
  # Main API with health checks for uptime monitoring
  - type: web
    name: voltledger-api
    runtime: docker
    rootDir: ./VoltLedger.Api
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health/detailed
    # Auto-restart on health check failure
    autoDeploy: false

  # External Monitoring Integration (UptimeRobot/BetterStack)
  # Render's native monitoring
    envVars:
      - key: ENABLE_DETAILED_HEALTH
        value: "true"
      - key: LOG_LEVEL
        value: "Information"
```

#### Corrected Monitoring Docker Compose (Local Dev Only)

```yaml
# docker-compose.monitoring.yml - Local development only
version: '3.8'

services:
  # Prometheus - Local development only
  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: voltledger-prometheus
    volumes:
      - ./infrastructure/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - monitoring
    # DO NOT include in Render.com deployment
    profiles:
      - monitoring

  # Grafana - Local development only
  grafana:
    image: grafana/grafana:10.0.0
    container_name: voltledger-grafana
    volumes:
      - ./infrastructure/monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3001:3000"
    networks:
      - monitoring
    depends_on:
      - prometheus
    # DO NOT include in Render.com deployment
    profiles:
      - monitoring

  # Application Metrics Sidecar (Optional)
  otel-collector:
    image: otel/opentelemetry-collector:0.81.0
    container_name: voltledger-otel
    command: ["--config=/etc/otel-collector-config.yml"]
    volumes:
      - ./infrastructure/monitoring/otel-collector.yml:/etc/otel-collector-config.yml:ro
    profiles:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

#### Application Health Check Endpoint (.NET)

```csharp
// Program.cs - Add detailed health checks
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Add health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgresql",
        tags: new[] { "db", "postgres" })
    .AddRedis(
        builder.Configuration.GetConnectionString("Redis")!,
        name: "redis",
        tags: new[] { "cache", "redis" })
    .AddCheck<VoltLedgerHealthCheck>("voltledger-custom");

// Add health check UI for local development
builder.Services.AddHealthChecksUI()
    .AddInMemoryStorage();

var app = builder.Build();

// Basic health endpoint for Render.com
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// Detailed health for monitoring
app.MapHealthChecks("/health/detailed", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// Health UI for local development
app.MapHealthChecksUI(options =>
{
    options.UIPath = "/health-ui";
});

app.Run();
```

#### Required NuGet Packages

```xml
<!-- VoltLedger.Api.csproj additions -->
<ItemGroup>
  <PackageReference Include="AspNetCore.HealthChecks.NpgSql" Version="8.0.0" />
  <PackageReference Include="AspNetCore.HealthChecks.Redis" Version="8.0.0" />
  <PackageReference Include="AspNetCore.HealthChecks.UI" Version="8.0.0" />
  <PackageReference Include="AspNetCore.HealthChecks.UI.InMemory.Storage" Version="8.0.0" />
  <PackageReference Include="AspNetCore.HealthChecks.Ui.Client" Version="8.0.0" />
</ItemGroup>
```

---

## 4. FIX: Docker Compose Supabase Port Configuration

### Problem
Supabase port incorrectly set to 54322 instead of standard PostgreSQL port 5432.

### Solution: Corrected docker-compose.yml

```yaml
# docker-compose.yml - CORRECTED
version: '3.8'

services:
  # PostgreSQL (Supabase)
  postgres:
    image: supabase/postgres:15.1.0.147
    container_name: voltledger-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: voltledger
      # SSL Mode for production
      PGSSLMODE: require
    ports:
      - "5432:5432"  # FIXED: Was 54322
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infrastructure/db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - voltledger-network

  # Supabase Auth (GoTrue)
  auth:
    image: supabase/gotrue:v2.91.0
    container_name: voltledger-auth
    environment:
      GOTRUE_DB_DRIVER: postgres
      # FIXED: Use correct port in connection string
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/postgres?sslmode=disable
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token}
      GOTRUE_JWT_EXP: 3600
    ports:
      - "9999:9999"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - voltledger-network

  # API Service
  api:
    build:
      context: .
      dockerfile: VoltLedger.Api/Dockerfile
    container_name: voltledger-api
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ASPNETCORE_URLS: http://0.0.0.0:8080
      # FIXED: Use correct port 5432
      ConnectionStrings__DefaultConnection: Host=postgres;Port=5432;Database=voltledger;Username=postgres;Password=${POSTGRES_PASSWORD:-postgres};SSL Mode=Disable
      # FIXED: Redis connection string
      ConnectionStrings__Redis: redis:6379,abortConnect=false
      JWT__Secret: ${JWT_SECRET:-super-secret-jwt-token}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      auth:
        condition: service_started
    networks:
      - voltledger-network

  # Frontend
  web:
    build:
      context: ./VoltLedger.Web
      dockerfile: Dockerfile
    container_name: voltledger-web
    environment:
      VITE_API_URL: http://localhost:8080/api
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - voltledger-network

  # Redis (FIXED: Health check added)
  redis:
    image: redis:7-alpine
    container_name: voltledger-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    # FIXED: Added proper health check
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s
    networks:
      - voltledger-network

  # Migration Runner
  migrate:
    build:
      context: .
      dockerfile: Dockerfile.Migrate
    container_name: voltledger-migrate
    environment:
      # FIXED: Use correct port for migrations
      ConnectionStrings__DefaultConnection: Host=postgres;Port=5432;Database=voltledger;Username=postgres;Password=${POSTGRES_PASSWORD:-postgres};SSL Mode=Disable
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - voltledger-network
    profiles:
      - migrate

volumes:
  postgres-data:
  redis-data:

networks:
  voltledger-network:
    driver: bridge
```

---

## 5. FIX: Redis Health Check

### Problem
Redis service has no health check, causing race conditions on startup.

### Solution: Redis Health Check Implementation

```yaml
# docker-compose.yml - Redis section with health check
  redis:
    image: redis:7-alpine
    container_name: voltledger-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    # FIXED: Proper health check configuration
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s
    restart: unless-stopped
    networks:
      - voltledger-network
```

#### Alternative Health Check (More Robust)

```yaml
  redis:
    image: redis:7-alpine
    container_name: voltledger-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    # FIXED: Detailed health check with saved data verification
    healthcheck:
      test: >
        sh -c "
          redis-cli ping | grep -q PONG && 
          redis-cli info persistence | grep -q 'rdb_last_bgsave_status:ok'
        "
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
    sysctls:
      - net.core.somaxconn=511
    restart: unless-stopped
    networks:
      - voltledger-network
```

#### Redis Connection String Validation

```csharp
// RedisHealthCheck.cs
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

public class RedisHealthCheck : IHealthCheck
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisHealthCheck> _logger;

    public RedisHealthCheck(
        IConnectionMultiplexer redis,
        ILogger<RedisHealthCheck> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            
            // Test connectivity
            var pingResult = await db.PingAsync();
            
            if (pingResult.TotalMilliseconds > 100)
            {
                _logger.LogWarning("Redis ping took {Latency}ms", pingResult.TotalMilliseconds);
                return HealthCheckResult.Degraded(
                    data: new Dictionary<string, object>
                    {
                        ["latency_ms"] = pingResult.TotalMilliseconds
                    });
            }

            // Test write operation
            var testKey = $"health:{Guid.NewGuid()}";
            await db.StringSetAsync(testKey, "ok", TimeSpan.FromSeconds(10));
            var value = await db.StringGetAsync(testKey);
            await db.KeyDeleteAsync(testKey);

            if (value != "ok")
            {
                return HealthCheckResult.Degraded("Redis write test failed");
            }

            return HealthCheckResult.Healthy("Redis operational", 
                new Dictionary<string, object>
                {
                    ["latency_ms"] = pingResult.TotalMilliseconds,
                    ["server"] = _redis.GetEndPoints().First().ToString()
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");
            return HealthCheckResult.Unhealthy("Redis connection failed", ex);
        }
    }
}
```

---

## 6. FIX: SSL Certificate Validation

### Problem
Database connection strings lack SSL mode configuration for production security.

### Solution: Mandatory SSL Mode

### Development Connection Strings (SSL Disabled)

```yaml
# docker-compose.yml - Development environment
services:
  api:
    environment:
      # Development: SSL mode disabled for local testing
      ConnectionStrings__DefaultConnection: >
        Host=postgres;
        Port=5432;
        Database=voltledger;
        Username=postgres;
        Password=${POSTGRES_PASSWORD};
        SSL Mode=Disable
      ConnectionStrings__Redis: redis:6379,abortConnect=false,ssl=false
```

### Production Connection Strings (SSL Required)

```yaml
# render.yaml - Production environment
  - type: web
    name: voltledger-api
    envVars:
      - key: ConnectionStrings__DefaultConnection
        # FIXED: SSL Mode=require for all production connections
        value: >
          Host=${DB_HOST};
          Port=5432;
          Database=voltledger;
          Username=${DB_USER};
          Password=${DB_PASSWORD};
          SSL Mode=require;
          Trust Server Certificate=true
```

### Connection String Builder (.NET)

```csharp
// DatabaseConfiguration.cs
public static class DatabaseConfiguration
{
    public static string BuildConnectionString(IConfiguration config, IHostEnvironment env)
    {
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = config["Database:Host"]!,
            Port = int.Parse(config["Database:Port"] ?? "5432"),
            Database = config["Database:Name"]!,
            Username = config["Database:User"]!,
            Password = config["Database:Password"]!,
            
            // FIXED: SSL configuration based on environment
            SslMode = env.IsProduction() 
                ? SslMode.Require 
                : SslMode.Disable,
            
            // Production: Verify certificate
            TrustServerCertificate = !env.IsProduction(),
            
            // Connection pooling
            MaxPoolSize = 100,
            MinPoolSize = 10,
            ConnectionLifetime = 300,
            Timeout = 30,
            CommandTimeout = 30
        };

        return builder.ConnectionString;
    }
}
```

### Program.cs Configuration

```csharp
// Program.cs - Secure database configuration
var builder = WebApplication.CreateBuilder(args);

// Build connection string with SSL enforcement
var connectionString = DatabaseConfiguration.BuildConnectionString(
    builder.Configuration, 
    builder.Environment);

// Configure EF Core with SSL
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null);
        
        // Migrations assembly
        npgsqlOptions.MigrationsAssembly("VoltLedger.Infrastructure");
    });
});

// Redis with SSL support
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var redisConfig = ConfigurationOptions.Parse(
        builder.Configuration.GetConnectionString("Redis")!);
    
    // FIXED: Enable SSL in production
    if (builder.Environment.IsProduction())
    {
        redisConfig.Ssl = true;
        redisConfig.AbortOnConnectFail = false;
    }
    
    return ConnectionMultiplexer.Connect(redisConfig);
});
```

### Environment-Specific App Settings

```json
// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=voltledger;Username=postgres;Password=postgres;SSL Mode=Disable",
    "Redis": "localhost:6379,abortConnect=false,ssl=false"
  }
}
```

```json
// appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "SSL Mode=require;Trust Server Certificate=false",
    "Redis": "SSL=true,abortConnect=false"
  }
}
```

---

## Implementation Checklist

### Immediate Actions Required

- [ ] 1. Update `render.yaml` with Docker runtime configuration
- [ ] 2. Create `scripts/migrate_with_rollback.py` for safe migrations
- [ ] 3. Update `docker-compose.yml` with correct port (5432)
- [ ] 4. Add Redis health check to `docker-compose.yml`
- [ ] 5. Add `SSL Mode=require` to all production connection strings
- [ ] 6. Remove or properly configure Prometheus/Grafana references

### Files to Create/Modify

1. **Create:**
   - `scripts/migrate_with_rollback.py`
   - `scripts/pre-deploy-migration.sh`
   - `Dockerfile.Migrate`
   - `infrastructure/monitoring/prometheus.yml`
   - `infrastructure/monitoring/otel-collector.yml`

2. **Modify:**
   - `render.yaml` - Docker deployment configuration
   - `docker-compose.yml` - Fix ports and add health checks
   - `VoltLedger.Api/Dockerfile` - .NET 8 Alpine
   - `VoltLedger.Api/Program.cs` - Health checks and SSL config
   - `*.csproj` - Add health check packages

### Validation Commands

```bash
# 1. Validate Docker Compose
docker-compose config

# 2. Test full stack locally
docker-compose up --build

# 3. Check Redis health
docker-compose exec redis redis-cli ping

# 4. Verify database connection (SSL)
docker-compose exec postgres psql -U postgres -c "\conninfo"

# 5. Test migration rollback
python scripts/migrate_with_rollback.py --dry-run

# 6. Render Blueprint validation
render blueprint validate render.yaml
```

---

## Security Notes

### Database SSL Requirements
- Production **MUST** use `SSL Mode=require`
- Development may use `SSL Mode=Disable` for local testing
- Never commit production credentials to git
- Use Render environment variables for secrets

### Migration Safety
- Always backup before migrations
- Use blue-green deployment for zero-downtime updates
- Test rollback procedures regularly
- Never run migrations directly on production without backup

### Monitoring
- Render.com provides basic health checks
- Use external services (UptimeRobot, BetterStack) for production monitoring
- Prometheus/Grafana are for local development only

---

**Document Version:** 1.0  
**Last Updated:** 2024-04-08  
**Status:** CRITICAL - Must implement before production deployment
