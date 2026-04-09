# 6. Infrastructure and Deployment

## 6.1 Deployment Overview

This section describes the infrastructure architecture, deployment strategy, and operational procedures for VoltLedger. The platform is designed for high availability, scalability, and cost-effectiveness, leveraging modern cloud-native technologies and best practices.

**Key Design Principles:**
- **Cloud-First Architecture**: Leverage managed services to minimize operational overhead
- **Infrastructure as Code**: Automate infrastructure provisioning for consistency
- **Environment Parity**: Maintain identical configurations across dev, staging, and production
- **Region Optimization**: Prioritize AWS Africa (Nairobi) and EU West regions for optimal user experience
- **Zero-Downtime Deployment**: Support blue-green and rolling deployment strategies

## 6.2 Render.com Deployment Configuration

### 6.2.1 Platform Selection Rationale

Render.com is selected as the primary hosting platform due to:
- Native support for both web services and static sites
- Automatic SSL/TLS certificates and HTTPS
- Git-based continuous deployment
- Automatic scaling and zero-configuration load balancing
- Cost-effective pricing for startup workloads
- Support regeneration (SSD storage)

### 6.2.2 Backend API Deployment (Web Service)

```yaml
# render.yaml - Infrastructure as Code Configuration
services:
  - type: web
    name: voltledger-api
    runtime: dotnet
    region: frankfurt
    plan: standard
    buildCommand: dotnet restore && dotnet publish -c Release -o out
    startCommand: dotnet out/VoltLedger.Api.dll
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: production
      - key: ASPNETCORE_URLS
        value: http://0.0.0.0:8080
      - key: ConnectionStrings__Supabase
        sync: false
      - key: Jwt__Secret
        sync: false
      - key: Jwt__Issuer
        fromConfig: jwt_issuer
      - key: Jwt__Audience
        fromConfig: jwt_audience
      - key: Cors__AllowedOrigins
        fromConfig: allowed_origins
    disk:
      name: uploads
      mountPath: /app/uploads
      sizeGB: 5
    autoDeploy: true
    healthCheckPath: /api/health
    domains:
      - api.voltledger.io
```

**Backend Deployment Specifications:**
| Property | Configuration |
|----------|---------------|
| Runtime | .NET 8 (ASP.NET Core) |
| Region | Frankfurt (EU) - nearest to Kenya |
| Plan | Standard (1vCPU, 1GB RAM) |
| Build System | Native Render.NET builder |
| Port | 8080 (internal) |
| Health Check | /api/health endpoint |
| Instance Count | Min 1, Max 3 (auto-scale) |

### 6.2.3 Frontend Deployment (Static Site)

```yaml
  - type: web
    name: voltledger-web
    runtime: node
    region: frankfurt
    plan: starter
    buildCommand: npm ci && npm run build
    staticPublishPath: dist
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_API_BASE_URL
        fromConfig: api_base_url
      - key: VITE_SUPABASE_URL
        fromConfig: supabase_url
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
      - key: VITE_PAYMENT_PROVIDER_KEY
        sync: false
    autoDeploy: true
    domains:
      - app.voltledger.io
      - voltledger.io
```

**Frontend Deployment Specifications:**
| Property | Configuration |
|----------|---------------|
| Framework | React 18 + Vite |
| Region | Frankfurt (EU) |
| Build Output | dist/ |
| CDN | Render Global CDN |
| Asset Caching | 1 year (immutable assets) |
| Prerendering | Enabled for SEO routes |

### 6.2.4 Environment-Specific Configuration

| Environment | URL | Plan | Auto-Deploy |
|-------------|-----|------|-------------|
| Production | api.voltledger.io | Standard | Disabled (manual approval) |
| Staging | api-staging.voltledger.io | Starter | Enabled |
| Preview | auto-generated | Starter | Per-branch |

## 6.3 CI/CD Pipeline (GitHub Actions)

### 6.3.1 Workflow Architecture

```
GitHub
│
├── Pull Request → Build + Test PR
│
├── Merge to Develop → Deploy to Staging
│
├── Merge to Main → Deploy to Production (pending approval)
│
└── Release Tag → Deploy to Production (auto)
```

### 6.3.2 Backend CI/CD Pipeline

```yaml
# .github/workflows/backend-ci-cd.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    paths: ['backend/**']

env:
  DOTNET_VERSION: '8.0.x'

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore Dependencies
        run: dotnet restore

      - name: Build Application
        run: dotnet build --configuration Release --no-restore

      - name: Run Tests
        run: dotnet test --no-build --verbosity normal

      - name: Run Code Analysis
        run: |
          dotnet tool install --global dotnet-format
          dotnet format --verify-no-changes --verbosity diagnostic

      - name: Run Security Scan (OWASP)
        uses: securecodewarrior/gh-action-add-sarif@v1
        with:
          sarif-file: 'security-scan.sarif'

  deploy-staging:
    name: Deploy to Staging
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - name: Deploy to Render (Staging)
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_API_STAGING_SID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

      - name: Wait for Deploy
        run: |
          sleep 30
          curl --fail https://api-staging.voltledger.io/api/health

      - name: Run Smoke Tests
        run: |
          pytest tests/e2e/backend-smoke-tests.py \
            --base-url=https://api-staging.voltledger.io

  deploy-production:
    name: Deploy to Production
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    concurrency: production
    
    steps:
      - name: Require Approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ github.TOKEN }}
          approvers: admin-team
          minimum-approvals: 1

      - name: Run Database Migration (Dry Run)
        run: |
          dotnet ef migrations script \
            --idempotent \
            --output migration.sql

      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_API_PRODUCTION_SID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

      - name: Run Database Migration
        run: |
          dotnet ef database update \
            --connection ${{ secrets.PROD_DB_CONNECTION }}

      - name: Run Health Check
        run: |
          sleep 30
          curl --fail https://api.voltledger.io/api/health

      - name: Run E2E Tests
        run: |
          pytest tests/e2e/backend-e2e-tests.py \
            --base-url=https://api.voltledger.io

      - name: Notify Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author
          text: 'Backend deployed to Production!'
```

### 6.3.3 Frontend CI/CD Pipeline

```yaml
# .github/workflows/frontend-ci-cd.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']
  pull_request:
    paths: ['frontend/**']

env:
  NODE_VERSION: '20'

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        run: npm ci

      - name: Run Linter
        run: npm run lint

      - name: Run Type Check
        run: npm run type-check

      - name: Run Unit Tests
        run: npm run test -- --coverage

      - name: Build Application
        run: npm run build
        env:
          VITE_API_BASE_URL: https://api-staging.voltledger.io

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  deploy-staging:
    name: Deploy to Staging
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - name: Deploy to Render (Staging)
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_WEB_STAGING_SID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  deploy-production:
    name: Deploy to Production
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    concurrency: production

    steps:
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_WEB_PRODUCTION_SID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Notify Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author
          text: 'Frontend deployed to Production!'
```

### 6.3.4 Deployment Approval Workflow

```yaml
# .github/workflows/release.yml
name: Production Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: true
          prerelease: false
```

### 6.3.5 Pipeline Monitoring Dashboard

| Metric | Threshold | Action |
|--------|-----------|--------|
| Build Duration | > 10 minutes | Alert |
| Test Coverage | < 80% | Block Deploy |
| Security Issues | High/Medium | Block Deploy |
| Deployment Time | > 5 minutes | Alert |
| Error Rate (Post-Deploy) | > 1% | Rollback |

## 6.4 Environment Configurations

### 6.4.1 Environment Overview

| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| Local | Development | Seeded test data | Any developer |
| Development | Feature testing | Synthetic data | Development team |
| Staging | Pre-production validation | Anonymized prod snapshot | Internal stakeholders |
| Production | Live system | Real data | Administrators only |

### 6.4.2 Environment Configuration Files

```ini
# appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft": "Information"
    }
  },
  "ConnectionStrings": {
    "Supabase": "postgresql://postgres:[password]@localhost:54322/postgres"
  },
  "Jwt": {
    "Secret": "dev-local-super-secret-key-change-in-production",
    "Issuer": "VoltLedger-Dev",
    "Audience": "VoltLedger-Dev-Client",
    "ExpiryHours": 24
  },
  "Cors": {
    "AllowedOrigins": "*"
  },
  "Payments": {
    "M-Pesa": {
      "ConsumerKey": "test_key",
      "ConsumerSecret": "test_secret",
      "PassKey": "test_passkey",
      "Shortcode": "174379",
      "Env": "sandbox"
    }
  }
}
```

```ini
# appsettings.Staging.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Jwt": {
    "Secret": "${JWT_SECRET}",
    "Issuer": "VoltLedger-Staging",
    "Audience": "VoltLedger-Staging-Client",
    "ExpiryHours": 8
  },
  "Cors": {
    "AllowedOrigins": "https://app-staging.voltledger.io"
  }
}
```

```ini
# appsettings.Production.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft": "Error"
    }
  },
  "AllowedHosts": "api.voltledger.io",
  "Jwt": {
    "Secret": "${JWT_SECRET}",
    "Issuer": "VoltLedger",
    "Audience": "VoltLedger-Client",
    "ExpiryHours": 4
  },
  "Cors": {
    "AllowedOrigins": "https://app.voltledger.io,https://voltledger.io"
  },
  "RateLimiting": {
    "PermitLimit": 100,
    "Window": 60,
    "SegmentsPerWindow": 4
  }
}
```

```typescript
// frontend/src/config/environments.ts
export const environments = {
  development: {
    baseURL: 'http://localhost:5000',
    supabase: {
      url: 'http://localhost:54321',
      anonKey: process.env.VITE_SUPABASE_LOCAL_ANON_KEY!,
    },
    features: {
      enableDebugMode: true,
      enableMockData: true,
    },
  },
  staging: {
    baseURL: 'https://api-staging.voltledger.io',
    supabase: {
      url: 'https://xyz123.supabase.co',
      anonKey: process.env.VITE_SUPABASE_STAGING_ANON_KEY!,
    },
    features: {
      enableDebugMode: false,
      enableMockData: false,
    },
  },
  production: {
    baseURL: 'https://api.voltledger.io',
    supabase: {
      url: 'https://abc456.supabase.co',
      anonKey: process.env.VITE_SUPABASE_PROD_ANON_KEY!,
    },
    features: {
      enableDebugMode: false,
      enableMockData: false,
    },
  },
};

export const currentEnvironment = 
  import.meta.env.VITE_APP_ENV || 'development';
```

### 6.4.3 Secret Management

**Render.com Secret Sync:**
```bash
# CLI command for managing secrets
render env import --file .env.staging --service voltledger-api-staging
render env export --service voltledger-api-staging
```

**GitHub Secrets Required:**
```
Organization Level:
- RENDER_API_KEY
- SLACK_WEBHOOK_URL

Repository Level:
- RENDER_API_PRODUCTION_SID
- RENDER_API_STAGING_SID
- RENDER_WEB_PRODUCTION_SID
- RENDER_WEB_STAGING_SID
- PROD_DB_CONNECTION
- JWT_SECRET (production)
- SUPABASE_SERVICE_KEY (production)
- M-PESA_API_CREDENTIALS (production)
```

## 6.5 Supabase Cloud Instance Setup

### 6.5.1 Region Selection Strategy

| Priority | Region | Location | Latency to Kenya | Primary Use |
|----------|--------|----------|------------------|-------------|
| 1 | eu-west-1 | Ireland | ~180ms | Production Primary |
| 2 | af-south-1 | Cape Town | ~90ms | Future Expansion |
| 3 | eu-central-1 | Frankfurt | ~160ms | Staging/DR |

**Region Justification:**
- EU West (Ireland) provides GDPR compliance for African data processing
- Low latency to East Africa via fiber optic links
- Strong legal framework for data protection
- Reliable infrastructure with 99.99% SLA

### 6.5.2 Project Configuration

```bash
# Supabase CLI initialization
supabase projects create voltledger-prod --org-id ${ORG_ID} --region eu-west-1
supabase projects create voltledger-staging --org-id ${ORG_ID} --region eu-central-1
```

**Database Configuration:**

```sql
-- Production database tier: Small (2 vCPU, 4GB RAM)
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Full-text search
CREATE EXTENSION IF NOT EXISTS "postgis";     -- Geographic queries
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- Encryption utilities
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance

-- Connection pooling configuration
-- Pool Size: 15 per backend instance
-- Max Connections: 60 (Small tier)
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';

-- Row Level Security policies
ALTER TABLE public.bike_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bike_bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON public.bike_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Auth Configuration:**
```json
{
  "site_url": "https://app.voltledger.io",
  "additional_redirect_urls": [
    "https://app-staging.voltledger.io/**",
    "http://localhost:5173/**"
  ],
  "jwt_expiry": 3600,
  "refresh_token_reuse_interval": 10,
  "security": {
    "enable_confirmations": true,
    "enable_signup": true,
    "enable_multi_factor": true,
    "mfa_methods": ["totp", "sms"]
  },
  "external_oauth_providers": {
    "google": {
      "enabled": true,
      "client_id": "${GOOGLE_CLIENT_ID}",
      "secret": "${GOOGLE_SECRET}"
    }
  }
}
```

### 6.5.3 Storage Buckets

| Bucket | Purpose | Access | CORS Policy |
|--------|---------|--------|-------------|
| bike-images | E-bike photos | Public Read, Admin Write | * |
| user-documents | KYC documents | Private | app.voltledger.io |
| trip-photos | User trip photos | Private | app.voltledger.io |
| exports | CSV/Excel exports | Private | app.voltledger.io |

### 6.5.4 Edge Functions Deployment

```typescript
// supabase/functions/payments/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { action, payload } = await req.json();
  
  // M-Pesa STK push integration
  if (action === 'initiate_payment') {
    const response = await fetch(
      'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    return new Response(JSON.stringify(await response.json()), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### 6.5.5 Backup Configuration

```bash
# Automated backup schedule
supabase --project-ref ${PROJECT_REF} backups create

# PIT Recovery (Point in Time)
# Supported: Last 7 days, any recovery point
```

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Automated | Daily | 7 days |
| Manual | On-demand | 30 days |
| PITR | Continuous | 7 days |

### 6.5.6 Database Migration Strategy

```bash
# Migration workflow
supabase db diff --linked > supabase/migrations/$(date +%Y%m%d%H%M%S)_migration.sql
supabase db lint                                     # Validate migrations
supabase db push --skip-verify-supabase-migrations  # Apply to remote

# Down migration (if needed)
supabase db reset                                    # Reset local
supabase db dump --data-only > backup.sql           # Full data backup
```

## 6.6 Docker Containerization

### 6.6.1 Local Development Docker Stack

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Supabase Local for dev parity
  supabase:
    image: supabase/supabase-local:latest
    ports:
      - "54321:54321"  # Kong API Gateway
      - "54322:54322"  # PostgreSQL
      - "54323:54323"  # Studio
      - "54324:54324"  # Inbucket (email)
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token}
    volumes:
      - supabase-data:/var/lib/postgresql/data
      - ./supabase/config.toml:/supabase/config.toml

  # Backend API
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    ports:
      - "5000:8080"
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__Supabase: Host=supabase;Port=54322;Database=postgres;Username=postgres;Password=${POSTGRES_PASSWORD}
      Jwt__Secret: ${JWT_SECRET}
    volumes:
      - ./backend:/src:cached
      - /src/bin
      - /src/obj
    depends_on:
      - supabase
    command: dotnet run --urls http://0.0.0.0:8080

  # Frontend
  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://localhost:5000
      VITE_SUPABASE_URL: http://localhost:54321
      VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    volumes:
      - ./frontend:/app:cached
      - /app/node_modules
    command: npm run dev -- --host

  # Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # Local SMTP for testing
  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    volumes:
      - mailpit-data:/data

volumes:
  supabase-data:
  redis-data:
  mailpit-data:
```

### 6.6.2 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["VoltLedger.Api.csproj", "./"]
COPY ["./packages/", "./packages/"]
RUN dotnet restore "./VoltLedger.Api.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "./VoltLedger.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./VoltLedger.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS production
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VoltLedger.Api.dll"]

FROM build AS development
WORKDIR /src
RUN dotnet tool install --global dotnet-ef
ENV PATH="${PATH}:/root/.dotnet/tools"
ENTRYPOINT ["dotnet", "watch", "run", "--urls", "http://0.0.0.0:8080"]
```

### 6.6.3 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# Development
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

# Production (Nginx)
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 6.6.4 Development Scripts

```bash
#!/bin/bash
# scripts/dev-start.sh

echo "Starting VoltLedger development environment..."

# Check .env file exists
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
fi

# Start services
docker-compose up -d supabase
sleep 10  # Wait for Supabase

docker-compose up -d redis mailpit
docker-compose up --build api web

# Migration helper
function migrate() {
    docker-compose exec api dotnet ef database update
}

# Log helper
function logs() {
    docker-compose logs -f "$@"
}

# Cleanup helper
function cleanup() {
    docker-compose down -v
    docker volume prune -f
}
```

### 6.6.5 Resource Allocation

| Service | CPU | Memory | Disk |
|---------|-----|--------|------|
| Supabase | 2 cores | 4GB | 20GB |
| API | 0.5 cores | 1GB | - |
| Web | 0.25 cores | 512MB | - |
| Redis | 0.25 cores | 512MB | - |
| Mailpit | 0.1 cores | 128MB | - |

## 6.7 Monitoring and Logging Strategy

### 6.7.1 Observability Stack

```
Metrics       Logs            Traces            Alerts
────────────────────────────────────────────────────────────
Prometheus    →  Loki     →   Jaeger      →   PagerDuty
Grafana       →  CloudWatch →  Render      →   Slack
Render Stats  →  Supabase   →  Application →   Email
```

### 6.7.2 Application Logging (Backend)

```csharp
// VoltLedger.Api/Program.cs - Logging configuration
var builder = WebApplication.CreateBuilder(args);

builder.Logging
    .ClearProviders()
    .AddConsole()
    .AddDebug();

if (builder.Environment.IsProduction())
{
    // Structured logging for production
    builder.Logging.AddJsonConsole(options =>
    {
        options.IncludeScopes = true;
        options.TimestampFormat = "yyyy-MM-dd HH:mm:ss ";
        options.JsonWriterOptions = new JsonWriterOptions
        {
            Indented = false
        };
    });
    
    // External log aggregation (example: CloudWatch)
    builder.Services.AddSingleton<ILoggerProvider, CloudWatchLoggerProvider>();
}

// Serilog integration for advanced features
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "VoltLedger.Api")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.Conditional(
        _ => builder.Environment.IsProduction(),
        wt => wt.AmazonCloudWatch(...))
    .CreateLogger();

builder.Host.UseSerilog();
```

```csharp
// Request logging middleware
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = Guid.NewGuid().ToString("N")[..8];
        
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["RequestId"] = requestId,
            ["UserId"] = context.User?.Identity?.Name ?? "anonymous",
            ["Path"] = context.Request.Path,
            ["Method"] = context.Request.Method,
            ["ClientIP"] = context.Connection.RemoteIpAddress
        }))
        {
            _logger.LogInformation("Request started");
            
            try
            {
                await _next(context);
                
                stopwatch.Stop();
                _logger.LogInformation(
                    "Request completed - Status: {StatusCode}, Duration: {DurationMs}ms",
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex,
                    "Request failed - Duration: {DurationMs}ms",
                    stopwatch.ElapsedMilliseconds);
                throw;
            }
        }
    }
}
```

### 6.7.3 Frontend Logging

```typescript
// frontend/src/utils/logger.ts
import * as Sentry from '@sentry/react';

const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';

class Logger {
  info(message: string, context?: Record<string, any>) {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, context);
    }
    // Send to logging service in production
  }

  warn(message: string, context?: Record<string, any>) {
    console.warn(`[WARN] ${message}`, context);
    if (!isDevelopment) {
      Sentry.captureMessage(message, { level: 'warning', extra: context });
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    console.error(`[ERROR] ${message}`, error, context);
    if (!isDevelopment) {
      Sentry.captureException(error, { extra: context });
    }
  }

  logApiCall(method: string, endpoint: string, duration: number, success: boolean) {
    // Analytics and tracing
    if (!isDevelopment) {
      // Send to analytics service
    }
  }
}

export const logger = new Logger();
```

### 6.7.4 Render.com Monitoring

**Built-in Metrics (Available via Dashboard):**
- CPU utilization (target: < 70%)
- Memory usage (target: < 80%)
- Request latency p95 (target: < 500ms)
- Error rate (target: < 0.5%)
- Disk usage (target: < 70%)

**Custom Metric Collection:**
```yaml
# render.yaml extensions
cronjobs:
  - name: metrics-collector
    schedule: "*/5 * * * *"
    buildCommand: ""
    startCommand: |
      curl -sf https://api.voltledger.io/api/health |
      python3 parse_metrics.py}
```

### 6.7.5 Alert Configuration

```yaml
# alert-rules.yml
groups:
  - name: voltledger-api-alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for 5 minutes"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow API responses"
          description: "p95 response time > 1 second"

      - alert: DatabaseConnectionFailed
        expr: up{job="supabase"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Supabase connection issue"

      - alert: LowDiskSpace
        expr: disk_available_bytes / disk_total_bytes < 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
```

### 6.7.6 Health Check Endpoint

```csharp
// VoltLedger.Api/Health/HealthChecks.cs
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly VoltLedgerDbContext _dbContext;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken)
    {
        try
        {
            await _dbContext.Database.ExecuteSqlRawAsync(
                "SELECT 1", cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed", ex);
        }
    }
}

// Program.cs
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<RedisHealthCheck>("cache")
    .AddCheck<PaymentGatewayHealthCheck>("mpesa");

app.MapHealthChecks("/api/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        var result = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                responseTime = e.Value.Duration.TotalMilliseconds
            })
        };
        
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(result);
    }
});
```

### 6.7.7 Dashboard Setup (Grafana)

**Metrics to Track:**
1. API Performance
   - Request rate by endpoint
   - Response time percentiles
   - Error distribution

2. Business Metrics
   - Active users
   - Booking creation rate
   - Payment success/failure rates
   - Bike utilization %

3. Infrastructure
   - CPU/Memory usage
   - Database connection pool
   - Disk I/O

## 6.8 SSL/TLS and Domain Configuration

### 6.8.1 Domain Architecture

| Domain | Service | Environment | SSL |
|--------|---------|-------------|-----|
| voltledger.io | Static Site | Production | Render (Auto) |
| www.voltledger.io | Redirect to apex | Production | Render (Auto) |
| app.voltledger.io | Frontend SPA | Production | Render (Auto) |
| api.voltledger.io | Backend API | Production | Render (Auto) |
| auth.voltledger.io | Supabase Auth | Production | Supabase (Auto) |
| db.voltledger.io | Supabase DB | Production | Supabase (Auto) |
| *-staging.* | All staging services | Staging | Render (Auto) |

### 6.8.2 SSL Configuration

**Render.com SSL (Automatic):**
- SSL certificates automatically provisioned via Let's Encrypt
- Auto-renewal 30 days before expiry
- TLS 1.3 enforced
- HSTS enabled for production domains

```yaml
# CORS and Security Headers
services:
  - type: web
    name: voltledger-api
    headers:
      - path: /*
        name: Strict-Transport-Security
        value: max-age=31536000; includeSubDomains
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: Content-Security-Policy
        value: default-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://*.supabase.co
```

### 6.8.3 DNS Configuration

```
; DNS Zone file for voltledger.io
$TTL 3600

; A Records
@           IN  A       76.76.21.21           ; Render static site
app        IN  CNAME   voltledger-web.onrender.com.
api        IN  CNAME   voltledger-api.onrender.com.

; Supabase
auth        IN  CNAME   xyz123.auth.supabase.co.
db          IN  CNAME   xyz123.db.supabase.co.
storage     IN  CNAME   xyz123.storage.supabase.co.

; MX Records (Google Workspace)
@          IN  MX  1   ASPMX.L.GOOGLE.COM.
@          IN  MX  5   ALT1.ASPMX.L.GOOGLE.COM.

; SPF Record
@          IN  TXT     "v=spf1 include:_spf.google.com ~all"

; DMARC Record
_dmarc     IN  TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc@voltledger.io"
```

### 6.8.4 CDN Configuration

**Render CDN Settings:**
```yaml
frontend:
  staticPublishPath: dist
  routes:
    - type: rewrite
      source: /api/*
      destination: https://api.voltledger.io/api/:splat
    - type: rewrite
      source: /auth/*
      destination: https://auth.voltledger.io/auth/v1/:splat
    - type: rewrite
      source: /*
      destination: /index.html
  headers:
    - source: /assets/*
      headers:
        Cache-Control: public, max-age=31536000, immutable
    - source: /*.js
      headers:
        Cache-Control: public, max-age=604800
```

## 6.9 Backup and Disaster Recovery

### 6.9.1 Backup Strategy Overview

| Data Type | Backup Method | Frequency | Retention | RTO | RPO |
|-----------|---------------|-----------|-----------|-----|-----|
| Database (Transactional) | Supabase PITR | Continuous | 7 days | 1 hour | 5 minutes |
| Database (Full) | Supabase Automated | Daily | 7 days | 4 hours | 24 hours |
| Database (Manual) | pg_dump | Weekly | 30 days | 4 hours | 7 days |
| File Storage (Images) | Supabase Storage | Real-time (replication) | 30 days | 2 hours | Real-time |
| Application Config | Git | Every commit | Indefinite | 1 hour | N/A |
| Infrastructure | Infrastructure as Code | Every change | Indefinite | 2 hours | N/A |

### 6.9.2 Database Backup Procedures

**Automated Backup (Supabase Managed):**
```bash
# Verify backup completion
supabase --project-ref ${PROJECT_REF} backups list

# Download backup (for testing/validation)
supabase --project-ref ${PROJECT_REF} backups download backup_id
```

**Manual Backup Script:**
```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

PROJECT_REF="${SUPABASE_PROJECT_REF}"
SERVICE_KEY="${SUPABASE_SERVICE_KEY}"
BACKUP_BUCKET="voltledger-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="voltledger_prod_${DATE}.sql.gz"

echo "Starting manual backup..."

# Create backup
pg_dump \
  --host=db.${PROJECT_REF}.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --format=custom \
  --file=/tmp/${BACKUP_FILE} \
  --gzip

# Upload to secure storage
aws s3 cp /tmp/${BACKUP_FILE} s3://${BACKUP_BUCKET}/database/ \
  --storage-class STANDARD_IA

# Cleanup local file
rm /tmp/${BACKUP_FILE}

# Verify backup
BACKUP_SIZE=$(aws s3 ls s3://${BACKUP_BUCKET}/database/${BACKUP_FILE} | awk '{print $3}')
echo "Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE} bytes)"

# Cleanup old backups (retention: 30 days)
aws s3 ls s3://${BACKUP_BUCKET}/database/ | while read -r line; do
  FILE_DATE=$(echo "$line" | awk '{print $1}')
  FILE_NAME=$(echo "$line" | awk '{print $4}')
  
  if [[ $(date -d "$FILE_DATE" +%s) -lt $(date -d "-30 days" +%s) ]]; then
    aws s3 rm s3://${BACKUP_BUCKET}/database/${FILE_NAME}
    echo "Deleted old backup: ${FILE_NAME}"
  fi
done
```

### 6.9.3 Disaster Recovery Procedures

**Scenario 1: Database Corruption**
```bash
# 1. Pause application writes
curl -X POST https://api.voltledger.io/api/admin/maintenance \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"mode": "maintenance"}'

# 2. Identify recovery point (within last 30 minutes)
RECOVERY_TIME="2024-01-15 14:30:00"

# 3. Restore from PITR
supabase --project-ref ${PROJECT_REF} restoration restore \cp--target-time "${RECOVERY_TIME}"

# 4. Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bike_bookings WHERE created_at > '2024-01-15 14:00:00';"

# 5. Resume operations
curl -X POST https://api.voltledger.io/api/admin/maintenance \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"mode": "active"}'
```

**Scenario 2: Region Failure (Failover to EU-Central)**
```bash
# NOTE: This requires prior setup of replication

# 1. Promote EU-Central read replica to primary
supabase --project-ref ${EU_CENTRAL_REF} databases promote

# 2. Update Render service environment variables
render env set LEGACY_PROJECT_REF=${EU_CENTRAL_REF} --service voltledger-api

# 3. Trigger deployment to pick up new config
render deploys create --service voltledger-api

# 4. Update DNS (if using custom apex domain)
# Update A records to point to failover region
```

**Scenario 3: Data Breach/Ransomware**
```bash
# 1. Immediately revoke all active sessions
supabase --project-ref ${PROJECT_REF} auth revoke-all-sessions

# 2. Rotate all secrets
# - JWT secrets
# - Database credentials
# - API keys
# - OAuth credentials

# 3. Restore from clean backup (pre-incident)
BACKUP_DATE="2024-01-14_230000"
BACKUP_FILE="voltledger_prod_${BACKUP_DATE}.sql.gz"

# Download and restore
aws s3 cp s3://${BACKUP_BUCKET}/database/${BACKUP_FILE} /tmp/
gunzip /tmp/${BACKUP_FILE}

psql $DATABASE_URL < /tmp/voltledger_prod_${BACKUP_DATE}.sql

# 4. Force password reset for all users
supabase --project-ref ${PROJECT_REF} auth admin send-password-reclaim-email

# 5. Review and audit access logs
# Check Supabase audit logs for suspicious activity
```

### 6.9.4 Recovery Testing Schedule

| Test Type | Frequency | Responsible | Validation |
|-----------|-----------|-------------|------------|
| Backup Integrity | Weekly | DevOps | Verify restore to staging |
| PITR Recovery | Monthly | DevOps | 4-hour recovery window test |
| Full DR Drill | Quarterly | All Teams | Complete failover test |
| Backup Restoration Timing | Monthly | DevOps | Verify RTO compliance |

### 6.9.5 Business Continuity Plan

**Critical Data Priority:**
1. **Tier 1** (Must recover within 1 hour): User auth data, active bookings, payment records
2. **Tier 2** (Must recover within 4 hours): Historical bookings, user profiles, bike inventory
3. **Tier 3** (Must recover within 24 hours): Analytics data, audit logs, non-critical assets

**Communication Plan:**
```
Severity 1 (Complete Outage)
├── First 5 min:   Automated alerts to on-call team
├── First 15 min:  Internal Slack notification
├── First 30 min:  Status page updated
├── First 60 min:  Email to key stakeholders
└── Recovery:       Post-mortem within 24 hours
```

**Escalation Matrix:**
| Duration | Action |
|----------|--------|
| 15 minutes | On-call engineer responds |
| 30 minutes | Team lead notified |
| 1 hour | Engineering manager engaged |
| 2+ hours | CTO/VP Engineering engaged, vendor support ticket opened |

## 6.10 Cost Optimization

### 6.10.1 Infrastructure Cost Projections

| Component | Provider | Monthly Cost | Notes |
|-----------|----------|--------------|-------|
| API Hosting | Render | $25-85 | Standard plan with auto-scaling |
| Frontend Hosting | Render | $0-19 | Static site + CDN |
| Database | Supabase | $25-150 | Small tier with backups |
| Auth | Supabase | Included | Part of database tier |
| Storage | Supabase | $10-25 | ~100GB images/docs |
| Monitoring | Render/CloudWatch | $20-50 | Built-in + additional logs |
| DNS | Cloudflare | $0 | Free tier sufficient |
| Email | SendGrid/Mailgun | $20 | Transactional emails |
| **Total** | | **$100-349/mo** | Varies by usage |

### 6.10.2 Scaling Tiers

**Startup Tier (0-1000 users):**
- Render Starter (API + Web)
- Supabase Free Tier
- Cost: ~$25/month

**Growth Tier (1,000-10,000 users):**
- Render Standard (API)
- Render Static Sites (Web)
- Supabase Small Database
- Cost: ~$150/month

**Scale Tier (10,000+ users):**
- Render Pro with scaling
- Supabase Medium Database
- Dedicated monitoring
- Cost: ~$400/month

## 6.11 Security Considerations

### 6.11.1 Network Security

| Layer | Implementation |
|-------|----------------|
| DDoS Protection | Render built-in + Cloudflare |
| WAF | Cloudflare Pro Plan |
| VPC | Render private networking |
| Database | Supabase connection pooled, SSL required |
| API | Rate limiting, CORS restrictions |

### 6.11.2 Compliance

**GDPR Compliance:**
- Data residency: EU-West (Ireland)
- Right to deletion: Automated via API
- Data portability: Export functionality
- Encryption: At rest and in transit

**OWASP Top 10 Mitigations:**
1. Injection: Parameterized queries via EF Core
2. Broken Auth: JWT with short expiry, MFA support
3. Sensitive Data Exposure: Encryption at rest
4. XXE: Disabled in XML parsers
5. Broken Access Control: RBAC with row-level security
6. Misconfiguration: Infrastructure as Code
7. XSS: React XSS prevention, CSP headers
8. Insecure Deserialization: System.Text.Json with strict mode
9. Known Vulnerabilities: Dependabot alerts
10. Insufficient Logging: Comprehensive audit trails

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2024-01-15 | DevOps Team | Initial infrastructure design |
| 1.1 | 2024-01-20 | DevOps Team | Added DR procedures and cost estimates |

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Architect | | | |
| Security Officer | | | |
| Project Manager | | | |
