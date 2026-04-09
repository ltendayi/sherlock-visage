/**
 * VoltLedger Payment Hook
 * Custom hook for payment operations
 */

import { useEffect } from 'react'
import usePaymentStore from '../store/paymentStore'

export const usePayment = (checkoutRequestId = null) => {
  const store = usePaymentStore()

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      store.stopStatusPolling()
    }
  }, [])

  useEffect(() => {
    // Start polling if checkoutRequestId provided
    if (checkoutRequestId) {
      store.startStatusPolling(checkoutRequestId)
    }
    
    return () => {
      store.stopStatusPolling()
    }
  }, [checkoutRequestId])

  return {
    // State
    payments: store.payments,
    pendingPayment: store.pendingPayment,
    currentTransaction: store.currentTransaction,
    isLoading: store.isLoading,
    error: store.error,
    paymentStatus: store.paymentStatus,
    
    // Actions
    initiateMpesaPayment: store.initiateMpesaPayment,
    checkPaymentStatus: store.checkPaymentStatus,
    initiatePaystackPayment: store.initiatePaystackPayment,
    verifyPaystackPayment: store.verifyPaystackPayment,
    fetchMyPayments: store.fetchMyPayments,
    fetchLoanPayments: store.fetchLoanPayments,
    initiateRefund: store.initiateRefund,
    retryPayment: store.retryPayment,
    recordCashPayment: store.recordCashPayment,
    clearPayment: store.clearPayment,
    clearError: store.clearError,
    
    // Computed
    isPending: store.paymentStatus === 'pending' || store.paymentStatus === 'initiating',
    isCompleted: store.paymentStatus === 'completed',
    isFailed: store.paymentStatus === 'failed',
  }
}

export default usePayment
