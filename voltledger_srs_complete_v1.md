# VoltLedger Software Requirements Specification

## E-Bike Lending Platform for Kenyan EV Market

---

**Document Information:**

| Field | Value |
|-------|-------|
| Project | VoltLedger |
| Repository | ltendayi/volt-ledger-ev (Private) |
| Version | 1.0 Draft |
| Date | 2026-04-08 |
| Status | Pending Approval |

**Authored By:**
- Data Architecture: volt_data_arch (DeepSeek-V3.2)
- Fintech Integration: volt_fintech (gpt-4.1-mini)  
- Infrastructure & DevOps: volt_devops (GPT-4.1-mini)

**Approval Pending From:**
- Lead Architect
- Fintech Security Officer
- Project Sponsor

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Functional Requirements](#3-functional-requirements)
4. [Data Architecture](#4-data-architecture)
5. [Fintech Integration](#5-fintech-integration)
6. [Infrastructure & Deployment](#6-infrastructure--deployment)
7. [Security & Compliance](#7-security--compliance)
8. [Appendix](#8-appendix)

---

## 1. Introduction

This Software Requirements Specification (SRS) document describes the complete technical requirements for VoltLedger, an e-bike lending platform designed for the Kenyan electric vehicle market.

### 1.1 Purpose

VoltLedger enables users to rent electric bicycles through a mobile-first interface, with payments processed via M-Pesa and alternative methods including Paystack. The platform manages bike inventory, user accounts, loan tracking, and financial reconciliation.

### 1.2 Scope

**In Scope:**
- User registration and verification (phone-based)
- E-bike inventory management with IoT tracking
- Loan booking and lifecycle management
- M-Pesa STK Push and B2C payments
- Paystack card/wallet integration
- Location-based bike availability
- Maintenance tracking
- Reporting and analytics

**Out of Scope (Phase 1):**
- Mobile native apps (PWA only)
- Battery swap infrastructure
- Insurance integration
- Credit scoring integration

### 1.3 Technology Stack

| Layer | Technology |
|-------|------------|
| Backend API | .NET 8 (ASP.NET Core) |
| Frontend | React + Vite + Ant Design |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Auth |
| Payments | M-Pesa Daraja API, Paystack |
| Hosting | Render.com |
| Monitoring | Prometheus + Grafana |

---

## 2. System Overview

### 2.1 System Context

```
┌─────────────────┐
│  Rider Mobile   │
│   (PWA/Browser) │
└────────┬────────┘
         │
     HTTPS/WSS
         │
┌────────▼────────┐
│ Render.com CDN  │
│  (Static Site)  │
└────────┬────────┘
         │
┌────────▼────────┐      ┌─────────────────┐
│  .NET 8 API     │◄────►│  Supabase       │
│  (Web Service)  │      │  (PostgreSQL)   │
└────────┬────────┘      └────────┬────────┘
         │                        │
    ┌────┴────┐              ┌────┴────┐
    ▼         ▼              ▼         ▼
M-Pesa   Paystack           Auth     Storage
API      API                JWT      Buckets
```

### 2.2 Core Actors

| Actor | Role | Primary Actions |
|-------|------|-----------------|
| Rider | End user | Browse bikes, book loans, make payments |
| Agent | Field staff | Verify IDs, collect cash payments, manage returns |
| Admin | Operations | Full system access, reports, configuration |
| Mechanic | Maintenance | Update bike health, schedule repairs |

### 2.3 Key Workflows

**Loan Booking Flow:**
1. Rider browses available bikes by location
2. Selects bike and date range
3. System calculates total (daily rate × days + deposit)
4. Rider initiates payment via M-Pesa STK Push
5. On confirmation, bike status changes to "rented"
6. Rider picks up bike from designated location
7. System tracks GPS via IoT during active loan
8. On return, final calculation and deposit refund

---

## 3. Functional Requirements

### 3.1 User Management

**FR-001: Registration**
- Users register with phone number (2547XXXXXXXX format)
- OTP verification via SMS (Africa's Talking)
- Profile completion: name, ID number, emergency contact
- Home location (county/ward) for regional data access

**FR-002: Authentication**
- JWT-based authentication (4-hour expiry in production)
- Refresh token rotation
- Multi-device support with session management
- Password reset via SMS

**FR-003: KYC Verification**
- ID number validation (Kenyan Huduma Namba/National ID)
- Manual verification by agent role
- Verified badge on profile

### 3.2 Bike Inventory

**FR-004: Bike Tracking**
- Real-time GPS tracking via IoT device (IMEI-based)
- Battery percentage monitoring
- Health status: motor, brakes, tires, frame
- Automatic alerts for maintenance needs

**FR-005: Availability**
- Location-based filtering (nearest first)
- Status: available, rented, maintenance, retired
- Daily rate display per bike
- Deposit requirement indicator

**FR-006: Maintenance**
- Scheduled maintenance tracking
- Mechanic assignment per bike
- Parts and labor cost tracking
- Service history per bike

### 3.3 Loan Management

**FR-007: Booking**
- Select pickup and return dates
- Calculate estimated total
- Reserve bike for 15 minutes during payment
- Contract acceptance (digital signature)

**FR-008: Active Loan**
- GPS tracking during active period
- Extend loan (if available, payment required)
- Report issues (damage, breakdown)
- Emergency contact integration

**FR-009: Return & Settlement**
- Return at any authorized location
- Final damage inspection
- Late fee calculation if applicable
- Deposit refund initiation

### 3.4 Payment Processing

**FR-010: M-Pesa Integration**
- STK Push to customer's phone
- B2C disbursements for refunds
- C2B for cash collected by agents
- Automatic reconciliation
- Retry mechanism for failed transactions

**FR-011: Paystack Integration**
- Card payments
- Mobile money wallets (alternative to M-Pesa)
- Webhook handling for async confirmations

**FR-012: Cash Payments**
- Agent interface to record cash collection
- Location-based cash handling permissions
- Cash + M-Pesa split payments

**FR-013: Financial Records**
- Transaction ledger (immutable)
- Payment status tracking
- Receipt generation
- Failed payment handling and retry

### 3.5 Notifications

**FR-014: SMS Notifications**
- Booking confirmation
- Payment reminders (24h before due)
- Overdue alerts
- Return confirmation

**FR-015: Push Notifications**
- Real-time payment confirmations
- Maintenance alerts
- Promotional offers (opt-in)

### 3.6 Reporting

**FR-016: Admin Reports**
- Daily revenue by location
- Bike utilization rates
- Overdue loan aging
- Agent performance
- Maintenance backlog

**FR-017: Rider Dashboard**
- Active loan overview
- Payment history
- Upcoming bookings
- Loyalty points (future)

---

# 4. Data Architecture

## 4.1 Overview

VoltLedger's data architecture is built on PostgreSQL via Supabase, designed specifically for the Kenyan e-bike lending market. The architecture supports mobile money integration (M-Pesa), phone-based authentication, offline-capable operations, and multi-tenant data isolation. All data storage complies with Kenyan Data Protection Act 2019 requirements.

---

## 4.2 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     USERS       │     │    E-BIKES      │     │   LOCATIONS     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PK user_id      │     │ PK bike_id      │     │ PK location_id  │
│    phone_number │     │ FK location_id  │◄────│    name         │
│    full_name    │     │    serial_no    │     │    gps_lat      │
│    id_number    │     │    model        │     │    gps_lng      │
│    role         │     │    battery_cap  │     │    hub_type     │
│    mpesa_consent│     │    status       │     │    county       │
│    created_at   │     │    daily_rate   │     │    ward         │
└────────┬────────┘     │    metadata(JSON)      └─────────────────┘
         │              └────────┬────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
         ▼              ▼                 ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     LOANS       │     │  MAINTENANCE    │     │  BIKE_HEALTH    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PK loan_id      │     │ PK maint_id     │     │ PK health_id    │
│ FK user_id      │────►│ FK bike_id      │     │ FK bike_id      │
│ FK bike_id      │────►│ FK completed_by │     │    battery_pct  │
│    status       │     │    type         │     │    motor_status │
│    start_date   │     │    priority     │     │    brake_health │
│    end_date     │     │    scheduled_at │     │    tire_health  │
│    daily_rate   │     │    completed_at │     │    last_check   │
│    deposit_amt  │     │    cost         │     │    alerts(JSON) │
│    total_paid   │     │    notes        │     └─────────────────┘
│    balance_due  │     └─────────────────┘
│    pickup_loc   │
└────────┬────────┘
         │
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    PAYMENTS     │     │   TRANSACTIONS  │     │ AUDIT_LOGS      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PK payment_id   │     │ PK txn_id       │     │ PK log_id       │
│ FK loan_id      │     │ FK loan_id      │     │    table_name   │
│    mpesa_ref    │     │ FK user_id      │     │    record_id    │
│    amount       │     │    type         │     │    action       │
│    method       │     │    amount       │     │    old_data(JSON)
│    status       │     │    mpesa_ref    │     │    new_data(JSON)
│    paid_at      │     │    status       │     │    performed_by │
│    mpesa_code   │     │    created_at   │     │    created_at   │
│    phone_used   │     │    metadata(JSON)      └─────────────────┘
└─────────────────┘     └─────────────────┘
```

### Relationship Definitions

| Relationship | Cardinality | Description |
|--------------|-------------|-------------|
| Users → Loans | 1:N | One user can have multiple loans over time |
| E-bikes → Loans | 1:N | One bike can be loaned to multiple users (sequentially) |
| Locations → E-bikes | 1:N | One location can host multiple bikes |
| Users → Payments | 1:N | User makes multiple payments |
| Loans → Payments | 1:N | One loan has multiple payment records |
| Loans → Transactions | 1:N | Loan generates multiple transactions |
| E-bikes → Maintenance | 1:N | Bike has maintenance history |
| E-bikes → Bike_Health | 1:1 | Current health status per bike |

---

## 4.3 Database Schema

### 4.3.1 Users Table

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(20) UNIQUE, -- Kenyan National ID
    date_of_birth DATE,
    role VARCHAR(20) DEFAULT 'rider' CHECK (role IN ('rider', 'admin', 'agent', 'mechanic')),
    
    -- Kenyan market specific
    mpesa_consent BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    id_verified BOOLEAN DEFAULT false,
    
    -- Location tracking
    home_county VARCHAR(50),
    home_ward VARCHAR(50),
    current_gps JSONB,
    
    -- Flexible attributes
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    
    -- Constraints
    CONSTRAINT valid_phone CHECK (phone_number ~ '^254[0-9]{9}$'),
    CONSTRAINT valid_gps CHECK (
        (current_gps IS NULL) OR 
        (current_gps ? 'lat' AND current_gps ? 'lng')
    )
);

-- Comments for documentation
COMMENT ON COLUMN users.phone_number IS 'Kenyan format: 2547XXXXXXXX';
COMMENT ON COLUMN users.id_number IS 'Huduma Namba or National ID';
COMMENT ON COLUMN users.mpesa_consent IS 'User consent for M-Pesa integration';
COMMENT ON COLUMN users.metadata IS 'JSON storage for flexible rider attributes';
```

### 4.3.2 E-bikes Table

```sql
CREATE TABLE e_bikes (
    bike_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(location_id),
    
    -- Hardware details
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(50),
    year_manufactured INTEGER,
    
    -- Battery specifications
    battery_capacity_kwh DECIMAL(4,2),
    battery_cycles INTEGER DEFAULT 0,
    current_battery_pct INTEGER CHECK (current_battery_pct BETWEEN 0 AND 100),
    
    -- IoT/Tracking
    imei VARCHAR(20) UNIQUE,
    iot_status VARCHAR(20) DEFAULT 'offline' CHECK (iot_status IN ('online', 'offline', 'maintenance')),
    last_seen_at TIMESTAMPTZ,
    last_gps JSONB,
    
    -- Business logic
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
    daily_rate_kes INTEGER NOT NULL, -- Kenyan Shillings
    deposit_required BOOLEAN DEFAULT true,
    deposit_amount_kes INTEGER DEFAULT 2000,
    
    -- Flexible storage
    specs JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN e_bikes.imei IS 'IoT device IMEI for GPS tracking';
COMMENT ON COLUMN e_bikes.specs IS 'JSON storage for model-specific features';
COMMENT ON COLUMN e_bikes.daily_rate_kes IS 'Daily rental rate in Kenyan Shillings';
```

### 4.3.3 Locations Table

```sql
CREATE TABLE locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    
    -- Kenyan administrative structure
    county VARCHAR(50) NOT NULL,
    sub_county VARCHAR(50),
    ward VARCHAR(50),
    constituency VARCHAR(50),
    
    -- GPS coordinates
    gps_latitude DECIMAL(10, 8) NOT NULL,
    gps_longitude DECIMAL(11, 8) NOT NULL,
    gps_accuracy_meters INTEGER,
    
    -- Hub characteristics
    hub_type VARCHAR(30) DEFAULT 'station' CHECK (hub_type IN ('station', 'partner_shop', 'mobile_unit')),
    is_active BOOLEAN DEFAULT true,
    operating_hours JSONB, -- { "monday": {"open": "08:00", "close": "18:00"} }
    
    -- Contact
    manager_phone VARCHAR(15),
    manager_name VARCHAR(100),
    
    -- Capacity
    max_bikes INTEGER DEFAULT 10,
    current_bikes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN locations.operating_hours IS 'JSON schedule for hub operating hours';
```

### 4.3.4 Loans Table

```sql
CREATE TYPE loan_status AS ENUM ('pending', 'active', 'overdue', 'completed', 'defaulted', 'cancelled');

CREATE TABLE loans (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    bike_id UUID NOT NULL REFERENCES e_bikes(bike_id),
    
    -- Loan terms
    status loan_status DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    
    -- Financial terms
    daily_rate_kes INTEGER NOT NULL,
    deposit_amount_kes INTEGER DEFAULT 0,
    total_days INTEGER,
    estimated_total_kes INTEGER,
    
    -- Payment tracking
    total_paid_kes INTEGER DEFAULT 0,
    balance_due_kes INTEGER DEFAULT 0,
    late_fee_kes INTEGER DEFAULT 0,
    
    -- Location tracking
    pickup_location_id UUID REFERENCES locations(location_id),
    return_location_id UUID REFERENCES locations(location_id),
    
    -- Agreement
    terms_accepted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMPTZ,
    contract_photo_url TEXT,
    
    -- Flex data
    rider_notes JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

COMMENT ON COLUMN loans.rider_notes IS 'Customer preferences, issues, special arrangements';
```

### 4.3.5 Payments Table

```sql
CREATE TYPE payment_method AS ENUM ('mpesa', 'cash', 'bank_transfer', 'wallet_credit');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(loan_id),
    user_id UUID NOT NULL REFERENCES users(user_id),
    
    -- Payment details
    amount_kes INTEGER NOT NULL,
    method payment_method DEFAULT 'mpesa',
    status payment_status DEFAULT 'pending',
    
    -- M-Pesa specific
    mpesa_request_id VARCHAR(50),
    mpesa_receipt_number VARCHAR(50),
    mpesa_checkout_request_id VARCHAR(70),
    phone_number_used VARCHAR(15),
    mpesa_result_code VARCHAR(10),
    mpesa_result_desc TEXT,
    
    -- Timing
    request_sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- References
    collected_by UUID REFERENCES users(user_id),
    collection_location_id UUID REFERENCES locations(location_id),
    
    -- Audit
    metadata JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_mpesa_receipt ON payments(mpesa_receipt_number) WHERE mpesa_receipt_number IS NOT NULL;
CREATE INDEX idx_payments_phone ON payments(phone_number_used);
```

### 4.3.6 Transactions Table

```sql
CREATE TYPE transaction_type AS ENUM (
    'deposit', 'rental_payment', 'late_fee', 'damage_charge',
    'refund', 'topup', 'withdrawal'
);

CREATE TABLE transactions (
    txn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(loan_id),
    user_id UUID REFERENCES users(user_id),
    bike_id UUID REFERENCES e_bikes(bike_id),
    
    -- Transaction details
    type transaction_type NOT NULL,
    amount_kes INTEGER NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('credit', 'debit')),
    
    -- References
    payment_id UUID REFERENCES payments(payment_id),
    related_txn_id UUID REFERENCES transactions(txn_id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'reversed')),
    
    -- Description
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id)
);

COMMENT ON COLUMN transactions.direction IS 'credit increases balance, debit decreases';
```

### 4.3.7 Maintenance Table

```sql
CREATE TABLE maintenance (
    maint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id UUID NOT NULL REFERENCES e_bikes(bike_id),
    scheduled_by UUID REFERENCES users(user_id),
    completed_by UUID REFERENCES users(user_id),
    
    -- Maintenance details
    type VARCHAR(50) NOT NULL, -- 'routine', 'repair', 'battery_replacement'
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expected_duration_hours INTEGER,
    
    -- Costs
    parts_cost_kes INTEGER DEFAULT 0,
    labor_cost_kes INTEGER DEFAULT 0,
    total_cost_kes INTEGER DEFAULT 0,
    
    -- Results
    findings TEXT,
    actions_taken TEXT,
    parts_used JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3.8 Bike Health Table

```sql
CREATE TABLE bike_health (
    health_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id UUID UNIQUE NOT NULL REFERENCES e_bikes(bike_id),
    
    -- Current status
    battery_percentage INTEGER CHECK (battery_percentage BETWEEN 0 AND 100),
    estimated_range_km INTEGER,
    motor_status VARCHAR(20) CHECK (motor_status IN ('excellent', 'good', 'fair', 'poor', 'critical')),
    brake_health VARCHAR(20) CHECK (brake_health IN ('excellent', 'good', 'fair', 'poor', 'critical')),
    tire_health VARCHAR(20) CHECK (tire_health IN ('excellent', 'good', 'fair', 'poor', 'critical')),
    frame_status VARCHAR(20) DEFAULT 'good',
    
    -- Alerts
    active_alerts JSONB DEFAULT '[]',
    
    -- History
    last_inspection_at TIMESTAMPTZ,
    last_inspection_by UUID REFERENCES users(user_id),
    next_inspection_due DATE,
    total_distance_km INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN bike_health.active_alerts IS 'Array of current maintenance alerts';
```

### 4.3.9 Audit Logs Table

```sql
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    
    -- What changed
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Data tracking
    old_data JSONB,
    new_data JSONB,
    changed_fields JSONB,
    
    -- Who and when
    performed_by UUID REFERENCES users(user_id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT
);

-- Partition by month for performance
CREATE INDEX idx_audit_logs_time ON audit_logs(performed_at);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
```

---

## 4.4 Row Level Security (RLS) Policies

### 4.4.1 RLS Enablement

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
```

### 4.4.2 Users Table Policies

```sql
-- Users can view their own profile
CREATE POLICY user_self_select ON users
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own non-sensitive fields
CREATE POLICY user_self_update ON users
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        role = (SELECT role FROM users WHERE user_id = auth.uid()) -- Prevent role escalation
    );

-- Agents/admins can view users in their county
CREATE POLICY agent_user_select ON users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()
            AND u.role IN ('admin', 'agent')
            AND (u.home_county = users.home_county OR u.role = 'admin')
        )
    );

-- Admins can update any user
CREATE POLICY admin_user_update ON users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

### 4.4.3 E-bikes Table Policies

```sql
-- All authenticated users can view available bikes
CREATE POLICY bike_public_select ON e_bikes
    FOR SELECT TO authenticated
    USING (status = 'available' OR EXISTS (
        SELECT 1 FROM users WHERE user_id = auth.uid() AND role IN ('admin', 'agent', 'mechanic')
    ));

-- Admins can manage all bikes
CREATE POLICY bike_admin_all ON e_bikes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Mechanics can update bikes assigned for maintenance
CREATE POLICY bike_mechanic_update ON e_bikes
    FOR UPDATE TO authenticated
    USING (
        status = 'maintenance' AND EXISTS (
            SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'mechanic'
        )
    );
```

### 4.4.4 Loans Table Policies

```sql
-- Users can view their own loans
CREATE POLICY loan_user_select ON loans
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can create loans for themselves
CREATE POLICY loan_user_insert ON loans
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own pending loans
CREATE POLICY loan_user_update ON loans
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() AND status IN ('pending', 'active')
    );

-- Agents can view and manage loans for their county
CREATE POLICY loan_agent_all ON loans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN users ru ON ru.user_id = loans.user_id
            WHERE u.user_id = auth.uid()
            AND u.role IN ('admin', 'agent')
            AND (u.home_county = ru.home_county OR u.role = 'admin')
        )
    );
```

### 4.4.5 Payments Table Policies

```sql
-- Users can view their own payments
CREATE POLICY payment_user_select ON payments
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users WHERE user_id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

-- System/user can insert payments
CREATE POLICY payment_insert ON payments
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users WHERE user_id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

-- Only admins can update/delete payments (for corrections)
CREATE POLICY payment_admin_update ON payments
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

---

## 4.5 Indexes for Performance

### 4.5.1 Primary Query Optimizations

```sql
-- Frequently queried phone numbers
CREATE INDEX idx_users_phone ON users(phone_number);

-- Loan status queries for dashboards
CREATE INDEX idx_loans_status_user ON loans(status, user_id) WHERE status IN ('active', 'overdue');
CREATE INDEX idx_loans_date_range ON loans(start_date, end_date);

-- Payment lookups by M-Pesa reference
CREATE INDEX idx_payments_mpesa ON payments(mpesa_request_id, mpesa_checkout_request_id);
CREATE INDEX idx_payments_loan_status ON payments(loan_id, status);

-- Bike availability queries
CREATE INDEX idx_bikes_status_location ON e_bikes(status, location_id) WHERE status = 'available';
CREATE INDEX idx_bikes_last_seen ON e_bikes(last_seen_at) WHERE iot_status = 'online';

-- Geographic queries
CREATE INDEX idx_locations_county ON locations(county, ward);

-- Transaction reporting
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type_date ON transactions(type, created_at) WHERE status = 'completed';
```

### 4.5.2 JSONB Indexes

```sql
-- GIN indexes for JSONB queries
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);
CREATE INDEX idx_bikes_specifications ON e_bikes USING GIN (specs);
CREATE INDEX idx_payments_metadata ON payments USING GIN (metadata);
CREATE INDEX idx_loans_rider_notes ON loans USING GIN (rider_notes);
```

### 4.5.3 Full-Text Search

```sql
-- Full-text search on bike models and user names
CREATE INDEX idx_bikes_search ON e_bikes 
    USING gin(to_tsvector('english', model || ' ' || COALESCE(manufacturer, '')));

CREATE INDEX idx_users_search ON users 
    USING gin(to_tsvector('english', full_name || ' ' || COALESCE(id_number, '')));
```

---

## 4.6 Audit Trail Requirements

### 4.6.1 Automated Audit Triggers

```sql
-- Function to capture changes
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields JSONB = '{}'::JSONB;
    key TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSE
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Calculate changed fields
        FOR key IN SELECT jsonb_object_keys(new_data) INTERSECT SELECT jsonb_object_keys(old_data)
        LOOP
            IF old_data->key IS DISTINCT FROM new_data->key THEN
                changed_fields = jsonb_set(changed_fields, ARRAY[key], jsonb_build_object('old', old_data->key, 'new', new_data->key));
            END IF;
        END LOOP;
    END IF;
    
    INSERT INTO audit_logs (
        table_name, record_id, action, old_data, new_data, changed_fields, performed_by
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_data,
        new_data,
        changed_fields,
        auth.uid()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to critical tables
CREATE TRIGGER users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER loans_audit
    AFTER INSERT OR UPDATE OR DELETE ON loans
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER payments_audit
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER e_bikes_audit
    AFTER INSERT OR UPDATE OR DELETE ON e_bikes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### 4.6.2 Data Retention Policy

| Data Type | Retention Period | Archive Action |
|-----------|------------------|----------------|
| Audit Logs | 3 years | Partition and compress after 1 year |
| Transaction Records | 7 years | Required for tax compliance |
| Payment Details | 5 years | Anonymize after loan completion + 2 years |
| M-Pesa Receipts | 3 years | Required for Safaricom reconciliation |
| GPS History | 90 days | Aggregate to daily summaries |
| IoT Telemetry | 30 days | Aggregate to hourly summaries |

### 4.6.3 Compliance Requirements (Kenya)

```sql
-- View for data subject access requests (Kenyan Data Protection Act)
CREATE VIEW user_data_export AS
SELECT 
    u.*,
    jsonb_agg(DISTINCT to_jsonb(l.*)) FILTER (WHERE l.loan_id IS NOT NULL) as loans,
    jsonb_agg(DISTINCT to_jsonb(p.*)) FILTER (WHERE p.payment_id IS NOT NULL) as payments,
    jsonb_agg(DISTINCT to_jsonb(t.*)) FILTER (WHERE t.txn_id IS NOT NULL) as transactions
FROM users u
LEFT JOIN loans l ON u.user_id = l.user_id
LEFT JOIN payments p ON u.user_id = p.user_id
LEFT JOIN transactions t ON u.user_id = t.user_id
WHERE u.user_id = auth.uid()
GROUP BY u.user_id;

-- Function for data deletion (right to erasure)
CREATE OR REPLACE FUNCTION anonymize_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET
        phone_number = 'ANONYMIZED-' || user_uuid::text,
        full_name = 'Anonymous User',
        id_number = NULL,
        current_gps = NULL,
        metadata = '{}'
    WHERE user_id = user_uuid;
    
    -- Anonymize related records
    UPDATE loans SET rider_notes = '{}' WHERE user_id = user_uuid;
    UPDATE payments SET phone_number_used = NULL WHERE user_id = user_uuid;
    
    -- Log the anonymization
    INSERT INTO audit_logs (table_name, record_id, action, new_data)
    VALUES ('users', user_uuid, 'ANONYMIZE', '{"action": "data_erasure"}'::jsonb);
END;
$$ LANGUAGE plpgsql;
```

---

## 4.7 Kenyan Market Adaptations

### 4.7.1 M-Pesa Integration Schema

```sql
-- M-Pesa API callback storage
CREATE TABLE mpesa_callbacks (
    callback_id BIGSERIAL PRIMARY KEY,
    merchant_request_id VARCHAR(50),
    checkout_request_id VARCHAR(70) UNIQUE,
    result_code INTEGER,
    result_desc TEXT,
    amount DECIMAL(10,2),
    mpesa_receipt_number VARCHAR(50),
    transaction_date TIMESTAMP,
    phone_number VARCHAR(15),
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- M-Pesa transaction reconciliation
CREATE TABLE mpesa_reconciliation (
    recon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_date DATE NOT NULL,
    total_transactions INTEGER,
    total_amount DECIMAL(12,2),
    mpesa_report_amount DECIMAL(12,2),
    variance DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.7.2 SMS Notification Queue

```sql
-- SMS notification storage for offline/AfricasTalking integration
CREATE TABLE sms_queue (
    sms_id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
    
    -- Kenyan telco handling
    telco VARCHAR(10) GENERATED ALWAYS AS (
        CASE 
            WHEN phone_number LIKE '2547%' THEN
                CASE 
                    WHEN phone_number LIKE '25470%' OR phone_number LIKE '25479%' THEN 'safaricom'
                    WHEN phone_number LIKE '25471%' OR phone_number LIKE '25472%' THEN 'safaricom'
                    WHEN phone_number LIKE '25474%' THEN 'safaricom'
                    WHEN phone_number LIKE '25475%' OR phone_number LIKE '25476%' THEN 'airtel'
                    WHEN phone_number LIKE '25477%' OR phone_number LIKE '25478%' THEN 'telkom'
                    ELSE 'unknown'
                END
            ELSE 'international'
        END
    ) STORED,
    
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_pending ON sms_queue(status, scheduled_at) WHERE status = 'pending';
```

### 4.7.3 Offline Sync Queue

```sql
-- Support for offline-first mobile app
CREATE TABLE sync_queue (
    sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    device_id TEXT,
    
    -- Operation details
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID,
    local_data JSONB,
    local_timestamp TIMESTAMPTZ NOT NULL,
    
    -- Sync status
    status VARCHAR(20) DEFAULT 'pending',
    synced_at TIMESTAMPTZ,
    server_record_id UUID,
    conflict_resolution VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conflict detection index
CREATE INDEX idx_sync_user_pending ON sync_queue(user_id, status) WHERE status IN ('pending', 'conflict');
```

---

## 4.8 Database Migration Strategy

### 4.8.1 Initial Migration Script

```sql
-- Migration: 001_initial_schema.sql
-- Description: Initial VoltLedger database schema
-- Author: Data Architecture Team
-- Date: 2024

BEGIN;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS voltledger;

-- Create types
CREATE TYPE loan_status AS ENUM ('pending', 'active', 'overdue', 'completed', 'defaulted', 'cancelled');
CREATE TYPE payment_method AS ENUM ('mpesa', 'cash', 'bank_transfer', 'wallet_credit');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE transaction_type AS ENUM (
    'deposit', 'rental_payment', 'late_fee', 'damage_charge',
    'refund', 'topup', 'withdrawal'
);

-- Create tables (defined in sections above)
-- Enable RLS
-- Create indexes
-- Create audit triggers

COMMIT;
```

### 4.8.2 Seeding Data

```sql
-- Seed locations (Kenyan counties with e-bike operations)
INSERT INTO locations (name, code, county, sub_county, ward, gps_latitude, gps_longitude, hub_type) VALUES
('Nairobi CBD Hub', 'NRB-001', 'Nairobi', 'Starehe', 'Nairobi Central', -1.2833, 36.8167, 'station'),
('Westlands Station', 'NRB-002', 'Nairobi', 'Westlands', 'Parklands', -1.2686, 36.8089, 'station'),
('Mombasa Island', 'MBA-001', 'Mombasa', 'Mvita', 'Majengo', -4.0500, 39.6667, 'station'),
('Kisumu City Hub', 'KIS-001', 'Kisumu', 'Kisumu Central', 'Market Milimani', -0.1000, 34.7500, 'station'),
('Nakuru Town', 'NKR-001', 'Nakuru', 'Nakuru Town East', 'Biashara', -0.2833, 36.0667, 'partner_shop');
```

---

## 4.9 Performance Considerations

### 4.9.1 Query Optimization

| Query Pattern | Optimization Strategy | Expected Performance |
|---------------|----------------------|---------------------|
| Available bikes by location | GIN index on (status, location_id) | < 50ms |
| User loan history | B-tree on (user_id, status) with partial index | < 30ms |
| M-Pesa reconciliation | B-tree on (mpesa_receipt_number) + date filter | < 100ms |
| Overdue loans report | Partial index on status='overdue' with date range | < 200ms |
| County-level reporting | B-tree on county with partition pruning | < 500ms |
| Real-time location tracking | Spatial indexing on GPS coordinates | < 20ms |

### 4.9.2 Connection Pooling

```yaml
# Supabase connection pooling configuration
max_connections: 200
superuser_reserved_connections: 3
tcp_keepalives_idle: 600
tcp_keepalives_interval: 30
tcp_keepalives_count: 3
shared_buffers: 2GB
effective_cache_size: 6GB
work_mem: 32MB
maintenance_work_mem: 512MB
```

---

## 4.10 Data Backup & Recovery

### 4.10.1 Backup Schedule

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Automated Point-in-Time | Continuous | 7 days | Supabase managed |
| Daily Full Backup | Daily | 30 days | S3-compatible |
| Weekly Archive | Weekly | 1 year | Cold storage |
| Monthly Archive | Monthly | 7 years | Glacier |

### 4.10.2 Disaster Recovery

- **RPO (Recovery Point Objective)**: 5 minutes
- **RTO (Recovery Time Objective)**: 1 hour
- **Failover**: Automatic with Supabase read replicas
- **Geographic Redundancy**: Multi-region replication to South Africa region

---

## 4.11 Data Governance

### 4.11.1 Access Control Matrix

| Role | Users | Bikes | Loans | Payments | Transactions | Maintenance |
|------|-------|-------|-------|----------|--------------|-------------|
| Rider | Own record only | View available | Own only | Own only | View own | None |
| Agent | County users | Full | County loans | Full | View | View assigned |
| Mechanic | View | Update assigned | View | None | None | Full |
| Admin | Full | Full | Full | Full | Full | Full |

### 4.11.2 Data Quality Rules

```sql
-- Check constraints for data quality
ALTER TABLE users ADD CONSTRAINT valid_kenyan_phone 
    CHECK (phone_number ~ '^254[0-9]{9}$');

ALTER TABLE e_bikes ADD CONSTRAINT valid_battery_pct 
    CHECK (current_battery_pct BETWEEN 0 AND 100);

ALTER TABLE loans ADD CONSTRAINT valid_kes_amount 
    CHECK (balance_due_kes >= 0 AND total_paid_kes >= 0);

-- Ensure no duplicate active loans per user
CREATE UNIQUE INDEX idx_one_active_loan_per_user 
    ON loans(user_id) WHERE status IN ('pending', 'active');

-- Ensure no duplicate active loans per bike
CREATE UNIQUE INDEX idx_one_active_loan_per_bike 
    ON loans(bike_id) WHERE status IN ('pending', 'active');
```

---

*End of Data Architecture Section*


## 5. Fintech Integration

### 5.1 M-Pesa Daraja API

**Transaction Types:**

| Type | API Endpoint | Use Case |
|------|--------------|----------|
| STK Push | `/mpesa/stkpush/v1/processrequest` | Customer pays from phone |
| B2C | `/mpesa/b2c/v1/paymentrequest` | Refunds to customer |
| C2B | `/mpesa/c2b/v1/registerurl` | Agent cash collection |
| Transaction Status | `/mpesa/transactionstatus/v1/query` | Reconciliation |
| Account Balance | `/mpesa/accountbalance/v1/query` | Daily balance check |

**Security Requirements:**
- OAuth 2.0 token generation (1-hour expiry)
- TLS 1.2+ for all communications
- Request signing with passkey
- Callback URL validation and replay prevention

**Idempotency:**
- Generate unique `OriginatorConversationID` per request
- Store request/response pairs for 7 days
- Automatic retry with exponential backoff (max 3 attempts)
- Duplicate detection via conversation ID

**Integer Math for Currency:**
```csharp
// Store amounts in CENTS (smallest unit)
// 1500 KES = 150000 cents
public class Money
{
    public long AmountCents { get; set; }  // Never use float/double
    public string Currency { get; } = "KES";
    
    public decimal ToDecimal() => AmountCents / 100m;
    public static Money FromKes(long kes) => new Money { AmountCents = kes * 100 };
}
```

### 5.2 Paystack Integration

**Features:**
- Card payments (Visa, Mastercard)
- Mobile money wallets
- Bank transfers
- USSD payments

**Webhook Security:**
- Verify webhook signature using secret key
- IP whitelist for Paystack servers
- Idempotent webhook processing

### 5.3 Reconciliation

**Daily Process:**
1. Query M-Pesa for settlement report (previous day)
2. Compare against internal transaction records
3. Flag discrepancies > 1 KES for review
4. Auto-resolve matching transactions
5. Generate reconciliation report

**Compliance:**
- Retain transaction records for 7 years (Kenyan tax law)
- PCI-DSS Level 1 compliance for card data
- M-Pesa partner agreement terms
- Kenyan Data Protection Act 2019

### 5.4 Error Handling

**Retry Strategy:**
```
1st attempt: Immediate
2nd attempt: 30 seconds
3rd attempt: 2 minutes
4th attempt: 5 minutes (then manual review)
```

**Failure Codes:**
| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Complete transaction |
| 1 | Insufficient funds | Notify customer |
| 2 | Cancelled by user | Mark as failed |
| 2001 | Wrong PIN | Prompt retry |
| Other | System error | Log and alert admin |

---

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
