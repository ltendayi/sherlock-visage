# VoltLedger Development Roadmap

## Phase 3: Core Implementation (Current)

### Task 3.1: Configure Repository Secrets
**ETA:** 15 minutes | **Agent:** volt_devops

#### Sub-tasks:
1. **Verify GitHub Authentication** (5 min)
   - [ ] Generate PAT with `repo` + `workflow` scopes
   - [ ] Test push access to ltendayi/volt-ledger-ev
   - [ ] Verify branch protection rules

2. **Configure Repository Secrets** (10 min)
   - [ ] `SUPABASE_URL` - Project URL from Supabase dashboard
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key for backend
   - [ ] `SUPABASE_ANON_KEY` - Anon key for frontend
   - [ ] `PAYSTACK_SECRET_KEY` - Live/TEST secret key
   - [ ] `PAYSTACK_PUBLIC_KEY` - Frontend public key
   - [ ] `MPESA_CONSUMER_KEY` - Daraja API consumer key
   - [ ] `MPESA_CONSUMER_SECRET` - Daraja API consumer secret
   - [ ] `MPESA_PASSKEY` - STK Push passkey (TEST: bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919)
   - [ ] `MPESA_SHORTCODE` - Paybill/Till number
   - [ ] `JWT_SECRET` - 256-bit random string
   - [ ] `ENCRYPTION_KEY` - 32-byte AES key for sensitive data

### Task 3.2: Local Development Environment
**ETA:** 30 minutes | **Agent:** volt_devops + volt_backend + volt_frontend

#### Sub-tasks:
1. **Docker Services Setup** (10 min)
   - [ ] Start Supabase local stack: `docker-compose up -d`
   - [ ] Verify PostgreSQL on port 54322
   - [ ] Verify Supabase Studio on port 54323
   - [ ] Run health checks on all services

2. **Initialize Database Schema** (10 min)
   - [ ] Apply migrations from SRS Section 4
   - [ ] Create 8 core tables with RLS policies
   - [ ] Set up audit triggers
   - [ ] Seed test data (1 admin, 1 agent, 3 bikes, 2 locations)
   - [ ] Verify relationships and constraints

3. **Start Development Servers** (10 min)
   - [ ] Backend: `dotnet run` on port 5001
     - Verify health endpoint: `GET /health`
     - Verify Swagger UI: `GET /swagger`
   - [ ] Frontend: `npm run dev` on port 5173
     - Verify Vite builds without errors
     - Verify API proxy working

### Task 3.3: Authentication System
**ETA:** 4 hours | **Agent:** volt_backend + volt_frontend

#### Sub-tasks:
1. **Backend Auth API** (2 hours)
   - [ ] Implement `POST /api/auth/register`
     - Validate Kenyan phone format (2547XXXXXXXX)
     - Generate unique user ID (UUID v4)
     - Hash password with bcrypt (cost 12)
     - Create user record with county from phone prefix
     - Return JWT access token (15 min expiry)
     - Return refresh token (7 days expiry)
   - [ ] Implement `POST /api/auth/login`
     - Verify phone + password
     - Update last_login timestamp
     - Generate new token pair
     - Log auth event to audit_logs
   - [ ] Implement `POST /api/auth/refresh`
     - Validate refresh token
     - Rotate refresh token (invalidate old)
     - Return new access token
   - [ ] Implement `POST /api/auth/logout`
     - Invalidate refresh token
     - Blacklist access token until expiry
   - [ ] Create JWT middleware
     - Extract token from Authorization header
     - Validate signature and expiry
     - Set User context on HttpContext
     - Handle 401/403 responses
   - [ ] Create RLS-aware query filter
     - County-based filtering for agents
     - Role-based access control

2. **Frontend Auth UI** (2 hours)
   - [ ] Create PhoneInput component
     - Format 2547XXXXXXXX automatically
     - Validate Kenyan prefixes (0701-0799)
     - Show county detection hint
   - [ ] Create Login page
     - Phone input + password
     - Loading states
     - Error handling toast
     - Redirect to dashboard on success
   - [ ] Create Register page
     - Phone + password + password_confirm
     - Terms acceptance checkbox
     - SMS consent checkbox (Kenyan DPA)
     - Success redirect with message
   - [ ] Create AuthContext/Zustand store
     - Store access token in memory
     - Store refresh token in httpOnly cookie
     - Auto-refresh token 2 min before expiry
     - Clear tokens on logout
   - [ ] Create ProtectedRoute component
     - Check for valid token
     - Redirect to login if missing
     - Show loading spinner during auth check
   - [ ] Create Header with user info
     - Display user name/phone
     - Logout button
     - County badge for agents

### Task 3.4: M-Pesa Integration
**ETA:** 6 hours | **Agent:** volt_fintech + volt_backend + volt_automation

#### Sub-tasks:
1. **Daraja API Setup** (1 hour)
   - [ ] Register M-Pesa callback URLs in Daraja portal
     - Validation URL: `https://api.voltledger.shavi.co.ke/api/mpesa/validate`
     - Confirmation URL: `https://api.voltledger.shavi.co.ke/api/mpesa/confirm`
   - [ ] Implement token generation
     - `GET /oauth/v1/generate?grant_type=client_credentials`
     - Cache access token (expires in 3600s)
     - Auto-refresh on 401 responses
   - [ ] Implement STK Push API
     - `POST /mpesa/stkpush/v1/processrequest`
     - Build request with BusinessShortcode, Password, Timestamp
     - Base64 encode password: `base64(shortcode+passkey+timestamp)`
     - Include CallbackURL for async response
     - Handle 200 (success), 400 (bad request), 500 (server error)

2. **Backend Payment Service** (2.5 hours)
   - [ ] Create PaymentRequest record
     - Store in payments table with status: 'pending'
     - Generate idempotency key (UUID)
     - Match phone to user account
   - [ ] Implement STK Push initiation
     - `POST /api/payments/mpesa/stk-push`
     - Validate phone format
     - Validate amount (min 10 KES)
     - Call Daraja STK Push API
     - Store CheckoutRequestID
     - Return pending status to frontend
   - [ ] Implement callback handlers
     - `POST /api/mpesa/callback`
     - Verify callback signature (if provided)
     - Parse ResultCode (0 = success)
     - Update payment status: success/failed
     - Create transaction record
     - Trigger loan status update
     - Send SMS notification via Africa's Talking
   - [ ] Implement status polling (fallback)
     - `POST /mpesa/stkpushquery/v1/query`
     - Poll every 10s for 90s
     - Handle user not found, transaction not found
   - [ ] Implement reconciliation
     - Query M-Pesa API for transactions
     - Match with internal records
     - Flag discrepancies
     - Generate daily reconciliation report

3. **Frontend Payment UI** (1.5 hours)
   - [ ] Create PaymentPage
     - Display loan details and balance
     - Show payment amount input
     - M-Pesa phone number (pre-filled from user)
   - [ ] Create STK Push flow
     - Initiate payment on submit
     - Show "Check your phone" message
     - Poll status every 5s
     - Show success/failure feedback
     - Update loan balance on success
   - [ ] Create payment history
     - List all payments with status
     - Show M-Pesa confirmation code
     - Export to PDF option

4. **Testing & Validation** (1 hour)
   - [ ] Test with Safaricom simulator
   - [ ] Test error scenarios (insufficient funds, timeout)
   - [ ] Verify idempotency (duplicate requests)
   - [ ] Test reconciliation accuracy
   - [ ] Document test credentials

### Task 3.5: Loan Management
**ETA:** 5 hours | **Agent:** volt_backend + volt_frontend

#### Sub-tasks:
1. **Backend Loan API** (3 hours)
   - [ ] Implement `GET /api/loans/available-bikes`
     - Query bikes with status: 'available'
     - Filter by county (for agents) or user's GPS location
     - Include bike details, pricing, location
     - Pagination (20 per page)
   - [ ] Implement `POST /api/loans/book`
     - Validate bike availability (lock row)
     - Check user eligibility (no overdue loans)
     - Calculate pricing based on duration
     - Create loan record with status: 'pending_payment'
     - Update bike status: 'reserved'
     - Set reservation expiry (30 min)
   - [ ] Implement payment confirmation callback
     - On M-Pesa success, update loan status: 'active'
     - Set loan_start_time to now
     - Calculate loan_end_time based on duration
     - Unlock bike via IoT API (placeholder)
   - [ ] Implement `POST /api/loans/extend`
     - Validate loan is active
     - Calculate extension cost
     - Require payment before extending
     - Update loan_end_time
   - [ ] Implement `POST /api/loans/return`
     - Calculate final charge (if over time)
     - Process payment if needed
     - Update loan status: 'completed'
     - Update bike status: 'available'
     - Log return location
   - [ ] Implement `GET /api/loans/my-loans`
     - List user's active and past loans
     - Include payment status
     - Sort by date descending
   - [ ] Implement admin endpoints
     - `GET /api/admin/loans` (all loans with filters)
     - `POST /api/admin/loans/{id}/override` (manual status change)

2. **Frontend Loan UI** (2 hours)
   - [ ] Create BikesList page
     - Show available bikes on map or list
     - Filter by battery level, price, location
     - Click to view bike details
   - [ ] Create Booking flow
     - Select duration (15min, 30min, 1hr, 2hr, daily)
     - Show pricing breakdown
     - Confirm booking (creates pending loan)
     - Redirect to payment page
   - [ ] Create ActiveLoan page
     - Show current ride timer
     - Display remaining battery estimate
     - "Extend ride" button
     - "Return bike" button
     - QR code for bike return verification
   - [ ] Create LoanHistory page
     - List past rides with costs
     - Download receipts
     - Report issues button

---

## Phase 4: Production Deployment (Pending)

### Task 4.1: Render.com Setup
**ETA:** 2 hours | **Agent:** volt_devops

#### Sub-tasks:
1. **Create Render Services** (30 min)
   - [ ] Web Service: voltledger-api
     - Connect GitHub repo
     - Branch: main
     - Build command: `dotnet publish -c Release`
     - Start command: `dotnet VoltLedger.Api.dll`
     - Environment variables from secrets
   - [ ] Static Site: voltledger-web
     - Build command: `cd frontend && npm ci && npm run build`
     - Publish directory: `frontend/dist`
   - [ ] PostgreSQL: voltledger-db
     - Region: Frankfurt (eu-central-1)
     - Version: 15
     - Plan: Starter ($7/month)
   - [ ] Redis: voltledger-redis
     - Plan: Starter ($0/month for small usage)

2. **Configure Environment** (30 min)
   - [ ] Copy all secrets from GitHub to Render
   - [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
   - [ ] Configure custom domain (api.voltledger.shavi.co.ke)
   - [ ] Enable auto-deploy on push to main

3. **Database Migration** (30 min)
   - [ ] Run `dotnet ef migrations add InitialCreate`
   - [ ] Apply migrations: `dotnet ef database update`
   - [ ] Verify all tables created in Render PostgreSQL
   - [ ] Run health check endpoint

4. **Smoke Tests** (30 min)
   - [ ] Test API health endpoint
   - [ ] Test frontend loads
   - [ ] Test authentication flow
   - [ ] Test M-Pesa in sandbox mode

---

## Task Estimates Summary

| Task | Sub-tasks | ETA | Status |
|------|-----------|-----|--------|
| 3.1: Repository Secrets | 11 items | 15 min | ⏳ Ready |
| 3.2: Local Dev Setup | 10 items | 30 min | ⏳ Ready |
| 3.3: Authentication | 14 items | 4 hrs | ⏳ Ready |
| 3.4: M-Pesa Integration | 20 items | 6 hrs | ⏳ Ready |
| 3.5: Loan Management | 16 items | 5 hrs | ⏳ Ready |
| 4.1: Production Deploy | 12 items | 2 hrs | ⏳ Pending |
| **TOTAL** | **83 items** | **~18 hrs** | **⏳ Ready to start** |

---

## Sprint Recommendations

**Sprint 1 (Week 1):** Tasks 3.1 - 3.3 (4.75 hrs)
- Repository setup + Auth system
- **Deliverable:** Working login/register + dev environment

**Sprint 2 (Week 2):** Tasks 3.4 - 3.5 (11 hrs)
- M-Pesa integration + Loan management
- **Deliverable:** Full booking flow in dev

**Sprint 3 (Week 3):** Task 4.1 (2 hrs)
- Production deployment
- **Deliverable:** Live MVP on Render.com

---

*Generated: 2026-04-08*
*SRS Reference: voltledger_srs_v1_1_PRODUCTION_READY.md*
