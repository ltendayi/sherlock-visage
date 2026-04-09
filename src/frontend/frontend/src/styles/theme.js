/**
 * VoltLedger Ant Design Theme Configuration
 * Primary color: #1890ff (Ant Design Blue)
 * Mobile-first design
 */

export const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    colorTextBase: '#000000',
    fontSizeBase: 14,
    borderRadius: 6,
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 44,
    },
    Card: {
      borderRadius: 8,
    },
    Layout: {
      headerHeight: 56,
      headerPadding: '0 16px',
    },
  },
}

// Kenyan phone number format regex
export const KENYA_PHONE_REGEX = /^254[0-9]{9}$/

// County list for Kenya
export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
  'Wajir', 'West Pokot'
]

// Bike status options
export const BIKE_STATUSES = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
}

// Loan status options
export const LOAN_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
}

// Payment methods
export const PAYMENT_METHODS = {
  MPESA: 'mpesa',
  PAYSTACK: 'paystack',
  CASH: 'cash',
}

// User roles
export const USER_ROLES = {
  RIDER: 'rider',
  ADMIN: 'admin',
  AGENT: 'agent',
  MECHANIC: 'mechanic',
}
