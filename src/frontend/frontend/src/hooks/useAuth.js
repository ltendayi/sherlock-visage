/**
 * VoltLedger Auth Hook
 * Custom hook for authentication operations
 */

import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

export const useAuth = () => {
  const store = useAuthStore()

  useEffect(() => {
    store.initialize()
  }, [])

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    otpSent: store.otpSent,
    phoneNumber: store.phoneNumber,
    
    // Actions
    setPhoneNumber: store.setPhoneNumber,
    requestOTP: store.requestOTP,
    verifyOTP: store.verifyOTP,
    register: store.register,
    updateProfile: store.updateProfile,
    logout: store.logout,
    clearError: store.clearError,
    resetOTP: store.resetOTP,
    
    // Computed
    isVerified: store.user?.id_verified || false,
    userRole: store.user?.role || 'rider',
  }
}

export default useAuth
