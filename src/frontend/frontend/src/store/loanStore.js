/**
 * VoltLedger Loan Store
 * Zustand state management for loans
 */

import { create } from 'zustand'
import * as loanService from '../services/loans'

const useLoanStore = create((set, get) => ({
  // State
  loans: [],
  activeLoan: null,
  selectedLoan: null,
  isLoading: false,
  error: null,
  bookingInProgress: false,

  // Actions
  fetchMyLoans: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const data = await loanService.getMyLoans(filters)
      set({ loans: data.loans || data, isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch loans', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  fetchActiveLoan: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await loanService.getActiveLoan()
      set({ activeLoan: data.loan || data, isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ isLoading: false })
      return { success: false }
    }
  },

  fetchLoanById: async (loanId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await loanService.getLoanById(loanId)
      set({ selectedLoan: data.loan || data, isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch loan', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  bookLoan: async (bookingData) => {
    set({ bookingInProgress: true, error: null })
    try {
      const data = await loanService.bookLoan(bookingData)
      set({ 
        selectedLoan: data.loan || data, 
        bookingInProgress: false 
      })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to book loan', 
        bookingInProgress: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  extendLoan: async (loanId, extensionData) => {
    set({ isLoading: true, error: null })
    try {
      const data = await loanService.extendLoan(loanId, extensionData)
      set({ 
        selectedLoan: data.loan || data, 
        isLoading: false 
      })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to extend loan', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  returnBike: async (loanId, returnData) => {
    set({ isLoading: true, error: null })
    try {
      const data = await loanService.returnBike(loanId, returnData)
      set({ 
        selectedLoan: data.loan || data, 
        activeLoan: null,
        isLoading: false 
      })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to return bike', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  cancelLoan: async (loanId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await loanService.cancelLoan(loanId)
      set({ isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to cancel loan', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  reportIssue: async (loanId, issueData) => {
    set({ isLoading: true, error: null })
    try {
      const data = await loanService.reportLoanIssue(loanId, issueData)
      set({ isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to report issue', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  getTracking: async (loanId, params = {}) => {
    try {
      const data = await loanService.getLoanTracking(loanId, params)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    }
  },

  selectLoan: (loan) => set({ selectedLoan: loan }),
  
  clearSelectedLoan: () => set({ selectedLoan: null }),

  clearError: () => set({ error: null }),
}))

export default useLoanStore
