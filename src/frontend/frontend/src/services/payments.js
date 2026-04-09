/**
 * VoltLedger Payment Service
 * M-Pesa STK Push, Paystack, and payment status checks
 */

import apiClient from './api'

/**
 * Initiate M-Pesa STK Push payment
 * @param {object} paymentData - Payment data
 * @returns {Promise} Payment initiation response
 */
export const initiateMpesaPayment = async (paymentData) => {
  const response = await apiClient.post('/payments/mpesa/stk-push', {
    loan_id: paymentData.loanId,
    phone_number: paymentData.phoneNumber,
    amount: paymentData.amount,
    description: paymentData.description || 'VoltLedger Payment',
  })
  return response.data
}

/**
 * Check M-Pesa payment status
 * @param {string} checkoutRequestId - M-Pesa checkout request ID
 * @returns {Promise} Payment status
 */
export const checkMpesaStatus = async (checkoutRequestId) => {
  const response = await apiClient.get(`/payments/mpesa/status/${checkoutRequestId}`)
  return response.data
}

/**
 * Initiate Paystack payment
 * @param {object} paymentData - Payment data
 * @returns {Promise} Paystack payment URL
 */
export const initiatePaystackPayment = async (paymentData) => {
  const response = await apiClient.post('/payments/paystack/initiate', {
    loan_id: paymentData.loanId,
    email: paymentData.email,
    amount: paymentData.amount,
    callback_url: paymentData.callbackUrl || window.location.origin + '/payment/callback',
  })
  return response.data
}

/**
 * Verify Paystack payment
 * @param {string} reference - Paystack transaction reference
 * @returns {Promise} Payment verification result
 */
export const verifyPaystackPayment = async (reference) => {
  const response = await apiClient.get(`/payments/paystack/verify/${reference}`)
  return response.data
}

/**
 * Record cash payment (Agent only)
 * @param {object} paymentData - Cash payment data
 * @returns {Promise} Payment record
 */
export const recordCashPayment = async (paymentData) => {
  const response = await apiClient.post('/payments/cash', {
    loan_id: paymentData.loanId,
    amount: paymentData.amount,
    collected_by: paymentData.collectedBy,
    location_id: paymentData.locationId,
    notes: paymentData.notes,
  })
  return response.data
}

/**
 * Get payment history for a loan
 * @param {string} loanId - Loan UUID
 * @returns {Promise} List of payments
 */
export const getLoanPayments = async (loanId) => {
  const response = await apiClient.get(`/payments/loan/${loanId}`)
  return response.data
}

/**
 * Get my payment history
 * @param {object} filters - Filter parameters
 * @returns {Promise} List of payments
 */
export const getMyPayments = async (filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  
  const response = await apiClient.get(`/payments/my?${params.toString()}`)
  return response.data
}

/**
 * Get payment receipt
 * @param {string} paymentId - Payment UUID
 * @returns {Promise} Receipt data
 */
export const getPaymentReceipt = async (paymentId) => {
  const response = await apiClient.get(`/payments/${paymentId}/receipt`)
  return response.data
}

/**
 * Initiate deposit refund
 * @param {string} loanId - Loan UUID
 * @returns {Promise} Refund initiation response
 */
export const initiateDepositRefund = async (loanId) => {
  const response = await apiClient.post(`/payments/refund/deposit`, {
    loan_id: loanId,
  })
  return response.data
}

/**
 * Retry failed payment
 * @param {string} paymentId - Payment UUID
 * @returns {Promise} Retry response
 */
export const retryPayment = async (paymentId) => {
  const response = await apiClient.post(`/payments/${paymentId}/retry`)
  return response.data
}

// Webhook handling for async notifications

/**
 * Register webhook handler for payment notifications
 * @param {Function} callback - Callback function for payment updates
 */
export const subscribeToPaymentUpdates = (callback) => {
  // This would typically use WebSocket or Server-Sent Events
  // For now, we'll use polling as fallback
  const pollInterval = setInterval(async () => {
    try {
      const pendingPayments = await apiClient.get('/payments/pending')
      if (pendingPayments.data && pendingPayments.data.length > 0) {
        callback(pendingPayments.data)
      }
    } catch (error) {
      console.error('Payment polling error:', error)
    }
  }, 10000) // Poll every 10 seconds

  // Return unsubscribe function
  return () => clearInterval(pollInterval)
}

// Admin functions

/**
 * Get all payments (Admin only)
 * @param {object} filters - Filter parameters
 * @returns {Promise} List of payments
 */
export const getAllPayments = async (filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.status) params.append('status', filters.status)
  if (filters.method) params.append('method', filters.method)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)
  
  const response = await apiClient.get(`/admin/payments?${params.toString()}`)
  return response.data
}

/**
 * Get daily reconciliation report (Admin only)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} Reconciliation data
 */
export const getDailyReconciliation = async (date) => {
  const response = await apiClient.get(`/admin/payments/reconciliation?date=${date}`)
  return response.data
}
