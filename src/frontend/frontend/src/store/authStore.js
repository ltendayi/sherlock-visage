/**
 * VoltLedger Auth Store
 * Zustand state management for authentication
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authService from '../services/auth'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpSent: false,
      phoneNumber: null,

      // Actions
      setPhoneNumber: (phone) => set({ phoneNumber: phone }),
      
      requestOTP: async (phoneNumber) => {
        set({ isLoading: true, error: null })
        try {
          await authService.requestOTP(phoneNumber)
          set({ otpSent: true, phoneNumber, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Failed to send OTP', 
            isLoading: false 
          })
          return { success: false, error: error.response?.data?.message }
        }
      },

      verifyOTP: async (otp) => {
        set({ isLoading: true, error: null })
        try {
          const { phoneNumber } = get()
          const data = await authService.verifyOTP(phoneNumber, otp)
          set({ 
            user: data.user, 
            isAuthenticated: true, 
            isLoading: false,
            otpSent: false,
          })
          return { success: true, data }
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Invalid OTP', 
            isLoading: false 
          })
          return { success: false, error: error.response?.data?.message }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authService.registerUser(userData)
          set({ isLoading: false })
          return { success: true, data }
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Registration failed', 
            isLoading: false 
          })
          return { success: false, error: error.response?.data?.message }
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authService.updateProfile(profileData)
          set({ user: data.user, isLoading: false })
          return { success: true, data }
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Update failed', 
            isLoading: false 
          })
          return { success: false, error: error.response?.data?.message }
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await authService.logout()
        } finally {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            phoneNumber: null,
            otpSent: false,
            error: null,
          })
        }
      },

      clearError: () => set({ error: null }),
      
      resetOTP: () => set({ otpSent: false, error: null }),

      // Initialize from localStorage
      initialize: () => {
        const user = authService.getCurrentUser()
        const isAuth = authService.isAuthenticated()
        if (user && isAuth) {
          set({ user, isAuthenticated: true })
        }
      },
    }),
    {
      name: 'voltledger-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export default useAuthStore
