/**
 * VoltLedger Payment Store
 * Zustand state management for payments
 */

import { create } from 'zustand'
import * as paymentService from '../services/payments'

const usePaymentStore = create((set, get) => ({
  // State
  payments: [],
  pendingPayment: null,
  currentTransaction: null,
  isLoading: false,
  error: null,
  paymentStatus: null,
  pollInterval: null,

  // Actions
  initiateMpesaPayment: async (paymentData) => {
    set({ isLoading: true, error: null, paymentStatus: 'initiating' })
    try {
      const data = await paymentService.initiateMpesaPayment(paymentData)
      set({ 
        pendingPayment: data,
        currentTransaction: data,
        paymentStatus: 'pending',
        isLoading: false 
      })
      // Start polling for status
      get().startStatusPolling(data.checkout_request_id)
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to initiate payment', 
        paymentStatus: 'failed',
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  checkPaymentStatus: async (checkoutRequestId) => {
    try {
      const data = await paymentService.checkMpesaStatus(checkoutRequestId)
      const status = data.status || data.result_code === '0' ? 'completed' : 'failed'
      set({ paymentStatus: status })
      
      if (status === 'completed' || status === 'failed') {
        get().stopStatusPolling()
      }
      
      return { success: true, data, status }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  },

  startStatusPolling: (checkoutRequestId) => {
    // Clear any existing interval
    get().stopStatusPolling()
    
    const interval = setInterval(() => {
      get().checkPaymentStatus(checkoutRequestId)
    }, 5000) // Poll every 5 seconds
    
    set({ pollInterval: interval })
    
    // Stop polling after 2 minutes
    setTimeout(() => {
      get().stopStatusPolling()
    }, 120000)
  },

  stopStatusPolling: () => {
    const { pollInterval } = get()
    if (pollInterval) {
      clearInterval(pollInterval)
      set({ pollInterval: null })
    }
  },

  initiatePaystackPayment: async (paymentData) => {
    set({ isLoading: true, error: null })
    try {
      const data = await paymentService.initiatePaystackPayment(paymentData)
      set({ 
        currentTransaction: data,
        isLoading: false 
      })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to initiate payment', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  verifyPaystackPayment: async (reference) => {
    set({ isLoading: true })
    try {
      const data = await paymentService.verifyPaystackPayment(reference)
      const status = data.status === 'success' ? 'completed' : 'failed'
      set({ paymentStatus: status, isLoading: false })
      return { success: true, data, status }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Verification failed', 
        isLoading: false 
      })
      return { success: false }
    }
  },

  fetchMyPayments: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const data = await paymentService.getMyPayments(filters)
      set({ payments: data.payments || data, isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch payments', 
        isLoading: false 
      })
      return { success: false }
    }
  },

  fetchLoanPayments: async (loanId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await paymentService.getLoanPayments(loanId)
      set({ payments: data.payments || data, isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ isLoading: false })
      return { success: false }
    }
  },

  initiateRefund: async (loanId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await paymentService.initiateDepositRefund(loanId)
      set({ isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to initiate refund', 
        isLoading: false 
      })
      return { success: false }
    }
  },

  retryPayment: async (paymentId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await paymentService.retryPayment(paymentId)
      set({ isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Retry failed', 
        isLoading: false 
      })
      return { success: false }
    }
  },

  recordCashPayment: async (paymentData) => {
    set({ isLoading: true, error: null })
    try {
      const data = await paymentService.recordCashPayment(paymentData)
      set({ isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to record payment', 
        isLoading: false 
      })
      return { success: false }
    }
  },

  clearPayment: () => {
    get().stopStatusPolling()
    set({ 
      pendingPayment: null, 
      currentTransaction: null, 
      paymentStatus: null,
      error: null,
    })
  },

  clearError: () => set({ error: null }),
}))

export default usePaymentStore
