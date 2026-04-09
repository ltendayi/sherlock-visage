# Data Architecture Audit Report - VoltLedger SRS Section 4

**Document:** voltledger_srs_complete_v1.md  
**Audit Scope:** Section 4 (Data Architecture) - Lines 280-1243  
**Date:** April 8, 2026  
**Auditor:** Subagent Review

---

## CRITICAL ISSUES (Must Fix)

### 1. RLS Policy Vulnerability on `loan_agent_all` Policy
**Location:** Section 4.4.4, Lines 782-793

**Issue:** The agent policy uses a JOIN on the loans table within the USING clause, which could create a circular reference:

```sql
CREATE POLICY loan_agent_all ON loans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN users ru ON ru.user_id = loans.user_id  -- Potential issue
            ...
        )
    );
```

**Risk:** Policy evaluation could fail or expose more data than intended due to the JOIN referencing `loans.user_id` inside the policy ON the loans table.

**Fix:** Restructure the policy to avoid the circular reference:
```sql
CREATE POLICY loan_agent_all ON loans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()
            AND u.role IN ('admin', 'agent')
            AND (
                u.role = 'admin' OR 
                u.home_county = (
                    SELECT home_county FROM users WHERE user_id = loans.user_id
                )
            )
        )
    );
```

---

### 2. Missing Index on `mpesa_callbacks.checkout_request_id` (Foreign Key Functionality)
**Location:** Section 4.7.1, Lines 1007-1021

**Issue:** The `mpesa_callbacks` table has a UNIQUE constraint on `checkout_request_id` but the `payments` table references it via `mpesa_checkout_request_id`. No FK relationship is defined.

**Current State:**
```sql
mpesa_checkout_request_id VARCHAR(70),  -- In payments table
-- No FOREIGN KEY constraint defined
```

**Risk:** Orphaned records, inconsistent data during reconciliation.

**Fix:** Add explicit foreign key relationship:
```sql
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_mpesa_callback 
FOREIGN KEY (mpesa_checkout_request_id) 
REFERENCES mpesa_callbacks(checkout_request_id);
```

---

### 3. Audit Trigger Bug - Record ID Reference
**Location:** Section 4.6.1, Lines 918-919

**Issue:** The audit trigger uses `NEW.id` or `OLD.id` but tables use `user_id`, `loan_id`, etc. as primary key names - not `id`.

```sql
COALESCE(NEW.id, OLD.id),  -- Will always be NULL - tables use *_id
```

**Risk:** Audit logs will have NULL `record_id` values, breaking compliance tracking.

**Fix:** Create separate triggers per table or use dynamic key resolution:
```sql
-- Option: Use NEW.primary_key dynamically
NEW.user_id IS NOT NULL THEN NEW.user_id
ELSIF NEW.loan_id IS NOT NULL THEN NEW.loan_id
...etc
```

---

### 4. Missing RLS on Critical Tables
**Location:** Section 4.4.1

**Issue:** RLS is enabled on 7 tables, but missing on `mpesa_callbacks`, `mpesa_reconciliation`, `audit_logs`, `sms_queue`, and `sync_queue`.

**Risk:** Sensitive M-Pesa data and audit trails may be exposed.

**Fix:** Add RLS and policies:
```sql
ALTER TABLE mpesa_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/agents should view callbacks
CREATE POLICY mpesa_callback_admin ON mpesa_callbacks
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role IN ('admin', 'agent')));

-- Users can only view own audit logs  
CREATE POLICY audit_log_user_select ON audit_logs
    FOR SELECT TO authenticated
    USING (performed_by = auth.uid());
```

---

### 5. Data Retention Policy Grades Misaligned with Kenyan Law
**Location:** Section 4.6.2, Lines 950-957

**Issue:** Kenyan Data Protection Act 2019 Section 26 requires "not longer than necessary" retention. GPS history at 90 days may violate user consent requirements if not justified.

**KO Act 2019 Compliance Gap:**
- GPS history: 90 days = HIGH RISK
- IoT telemetry: 30 days = HIGH RISK
- No explicit consent tracking for location data retention

**Fix:** Add consent-based retention and shorter periods:
```sql
ALTER TABLE users ADD COLUMN gps_consent_granted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN gps_consent_expires_at TIMESTAMPTZ;

-- Shorter default retention with consent override
```

---

## WARNINGS (Should Fix)

### 6. No Currency Type Enforcement
**Location:** Throughout schema (e.g., Section 4.3.5)

**Issue:** Amounts stored as INTEGER (`amount_kes`) but no currency domain type.

**Risk:** Inconsistent currency handling between tables.

**Fix:** Create a domain type:
```sql
CREATE DOMAIN kes_amount AS INTEGER CHECK (VALUE >= 0);
COMMENT ON DOMAIN kes_amount IS 'Amount in Kenyan Shillings (KES)';
```

---

### 7. Missing Indexes for Overdue Loan Queries
**Location:** Section 4.5.1

**Issue:** Dashboards will frequently query `WHERE status = 'overdue' AND end_date < CURRENT_DATE` - no composite index exists for this.

**Recommended:**
```sql
CREATE INDEX idx_loans_overdue_dashboard 
ON loans(status, end_date) 
WHERE status = 'overdue';
```

---

### 8. Payments Table Missing Finalized Index
**Location:** Section 4.3.5

**Issue:** No index on `(loan_id, status)` for common "outstanding payments" queries.

**Recommended:**
```sql
CREATE INDEX idx_payments_loan_pending 
ON payments(loan_id, status) 
WHERE status IN ('pending', 'processing');
```

---

### 9. Bike Health Redundant With E-bikes Table
**Location:** Section 4.3.8

**Issue:** `bike_health.battery_percentage` duplicates `e_bikes.current_battery_pct`. Potential synchronization issues.

**Recommendation:** Create a view instead of separate table or establish trigger synchronization.

---

### 10. M-Pesa Reconciliation Missing Foreign Key to Payment
**Location:** Section 4.7.1

**Issue:** `mpesa_reconciliation` table has no link to `transactions` or `payments` for variance investigation.

**Recommended:** Add:
```sql
ALTER TABLE mpesa_reconciliation 
ADD COLUMN investigation_payment_ids UUID[]; -- References to disputed payments
```

---

### 11. Sync Queue Missing Conflict Resolution Detail
**Location:** Section 4.7.3, Line 1097

**Issue:** `conflict_resolution` is VARCHAR(20) but no constraints or enum for valid values.

**Fix:** Add enum type:
```sql
CREATE TYPE conflict_resolution_strategy AS ENUM 
    ('client_wins', 'server_wins', 'merge', 'manual_review');
```

---

### 12. `anonymize_user()` Function Incomplete
**Location:** Section 4.6.3, Lines 977-996

**Issue:** Function anonymizes user but leaves:
- `audit_logs` entries with original user reference
- `sync_queue` references intact
- Doesn't handle `transactions` table references

**Kenya DPA Section 26:** Right to erasure requires complete anonymization.

**Fix:** Update all referencing tables:
```sql
UPDATE audit_logs SET performed_by = NULL WHERE performed_by = user_uuid;
UPDATE sync_queue SET user_id = '00000000-0000-0000-0000-000000000000'::UUID 
WHERE user_id = user_uuid;
-- etc...
```

---

### 13. Missing Partition Strategy for `audit_logs`
**Location:** Section 4.3.9

**Issue:** Comment says "Partition by month for performance" but no actual partitioning is defined.

**Recommended:** Implement declarative partitioning:
```sql
CREATE TABLE audit_logs_part (
    log_id BIGSERIAL,
    performed_at TIMESTAMPTZ NOT NULL,
    ...
) PARTITION BY RANGE (performed_at);

CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_part
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

### 14. Inconsistent Phone Number Validation
**Location:** Throughout tables

**Issue:** Some tables use VARCHAR(15), no consistent CHECK constraint across all phone columns.

**Tables Affected:** `users`, `payments`, `mpesa_callbacks`, `sms_queue`

**Recommended:** Create domain:
```sql
CREATE DOMAIN kenyan_phone AS VARCHAR(15)
    CHECK (VALUE ~ '^254[0-9]{9}$');
```

---

## APPROVED SECTIONS

### Schema Design (4.3.x Tables)
- **Users Table (4.3.1):** Well-designed with Kenyan-specific fields (home_county, ward), proper GPS JSONB structure, metadata extensibility
- **Loans Table (4.3.4):** Complete loan lifecycle coverage with status enum, proper financial tracking fields
- **Transactions Table (4.3.6):** Good accounting structure with direction indicators and relationship tracking

### E-bike Lending Schema (4.3.2, 4.3.7, 4.3.8)
- **Physical Asset Tracking:** Battery cycles, capacity, IoT IMEI, health metrics all covered
- **Maintenance Workflow:** Comprehensive status tracking from scheduling to completion
- **Rate Management:** Flexible daily_rate_kes with deposit handling

### M-Pesa Schema (4.7.1)
- **mpesa_callbacks:** Excellent raw_payload JSONB for capturing full API response
- **mpesa_reconciliation:** Proper settlement_date focus for bank reconciliation
- **Receipt Tracking:** Unique constraints prevent duplicate processing

### Kenyan Market Adaptations (4.7)
- **SMS Queue:** Telco detection via generated column is excellent for routing
- **Locations Table:** Proper Kenyan administrative structure (county, sub_county, ward, constituency)
- **Phone Validation:** Regex `^254[0-9]{9}$` correctly validates Kenyan format

### Performance Indexes (4.5)
- **Loan Status Partial Index:** Good use of partial index for active/overdue filtering
- **GIN on JSONB:** All metadata fields properly covered
- **Full-Text Search:** Users and bikes have GIN tsvector indexes

### Data Quality Rules (4.11.2)
- **Unique Constraint:** `idx_one_active_loan_per_user` prevents duplicate active loans
- **Bike Availability:** `idx_one_active_loan_per_bike` ensures no double-booking

### Access Control Matrix (4.11.1)
- **Role Mapping:** Clear definition of Rider/Agent/Mechanic/Admin permissions
- **County-Based Access:** Appropriate regional data segmentation for Kenyan operations

---

## ADDITIONAL RECOMMENDATIONS

### 1. Add Temporal Versioning for Financial Data
```sql
ALTER TABLE loans ADD COLUMN valid_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE loans ADD COLUMN valid_to TIMESTAMPTZ;
```

### 2. GDPR/KO Act Article 35 - DPIA Trigger Checklist
Add a table to track Data Protection Impact Assessments:
```sql
CREATE TABLE dpia_records (
    dpia_id UUID PRIMARY KEY,
    feature_area VARCHAR(100),
    risk_level VARCHAR(20),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMPTZ
);
```

### 3. Add `updated_at` Triggers
Multiple tables lack auto-updating `updated_at` triggers.

---

## SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| CRITICAL Issues | 5 | Must Fix Before Launch |
| WARNINGS | 9 | Fix Before Production |
| Approved Sections | 7 | Compliant |
| Total Reviewed | 21 | Complete |

**Overall Assessment:** The Data Architecture section demonstrates strong understanding of Kenyan market requirements and e-bike lending domain. However, **5 critical issues** must be resolved, particularly the RLS policy vulnerability and audit trigger bug which could compromise security and compliance.

**Compliance with Kenyan Data Protection Act 2019:** Partial - requires fixes for retention policies and complete anonymization function.

---

*End of Audit Report*
