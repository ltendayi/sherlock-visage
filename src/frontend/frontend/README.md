# VoltLedger Frontend

React Vite + Ant Design frontend for VoltLedger - E-Bike Lending Platform for the Kenyan EV Market.

## Features

- **Authentication**: Phone + OTP login (Kenyan format 2547XXXXXXXX)
- **KYC Verification**: Kenyan National ID validation
- **Bike Browsing**: Location-based filtering by county/ward
- **Loan Booking**: Date selection with cost calculation
- **Payment Integration**: M-Pesa STK Push and Paystack
- **Active Loan Tracking**: Real-time loan management
- **Mobile-First PWA**: Responsive design for mobile users
- **Admin Panel**: Dashboard for administrators and agents

## Tech Stack

- **Framework**: React 19 + Vite 8
- **UI Library**: Ant Design 6
- **State Management**: Zustand
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Icons**: @ant-design/icons

## Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Route-level components
│   ├── Admin/      # Admin panel routes
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Bikes.jsx
│   ├── BookLoan.jsx
│   ├── ActiveLoan.jsx
│   └── Payment.jsx
├── hooks/          # Custom React hooks
│   ├── useAuth.js
│   ├── useGeolocation.js
│   └── usePayment.js
├── services/       # API service layer
│   ├── api.js
│   ├── auth.js
│   ├── bikes.js
│   ├── loans.js
│   └── payments.js
├── store/          # Zustand state management
│   ├── authStore.js
│   ├── bikeStore.js
│   ├── loanStore.js
│   └── paymentStore.js
├── utils/          # Utility functions
│   ├── validators.js
│   └── helpers.js
└── styles/         # Global styles
    ├── theme.js
    └── global.css
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your API endpoints
# VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Development

```bash
# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | http://localhost:5000/api/v1 |
| VITE_SUPABASE_URL | Supabase project URL | - |
| VITE_SUPABASE_ANON_KEY | Supabase anon key | - |
| VITE_MPESA_SHORTCODE | M-Pesa shortcode | - |
| VITE_PAYSTACK_PUBLIC_KEY | Paystack public key | - |

## Kenyan Market Features

- Phone validation: `2547XXXXXXXX` format
- County/ward filtering for bike search
- M-Pesa STK Push integration
- Kenyan ID (Huduma Namba) validation
- KES currency formatting

## License

Private - Proprietary
