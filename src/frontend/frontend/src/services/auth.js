/**
 * VoltLedger Authentication Service
 * Handles login, registration, JWT, and session management
 */

import apiClient from './api'

/**
 * Request OTP for phone number verification
 * @param {string} phoneNumber - Kenya format (2547XXXXXXXX)
 * @returns {Promise}
 */
export const requestOTP = async (phoneNumber) => {
  const response = await apiClient.post('/auth/otp/request', {
    phone_number: phoneNumber,
  })
  return response.data
}

/**
 * Verify OTP and login
 * @param {string} phoneNumber - Kenya format
 * @param {string} otp - 6-digit OTP
 * @returns {Promise} User data and tokens
 */
export const verifyOTP = async (phoneNumber, otp) => {
  const response = await apiClient.post('/auth/otp/verify', {
    phone_number: phoneNumber,
    otp,
  })
  
  // Store tokens and user data
  if (response.data.access_token) {
    localStorage.setItem('voltledger_token', response.data.access_token)
    localStorage.setItem('voltledger_refresh_token', response.data.refresh_token)
    localStorage.setItem('voltledger_user', JSON.stringify(response.data.user))
  }
  
  return response.data
}

/**
 * Register new user
 * @param {object} userData - User registration data
 * @returns {Promise}
 */
export const registerUser = async (userData) => {
  const response = await apiClient.post('/auth/register', {
    phone_number: userData.phoneNumber,
    full_name: userData.fullName,
    id_number: userData.idNumber,
    date_of_birth: userData.dateOfBirth,
    home_county: userData.homeCounty,
    home_ward: userData.homeWard,
    emergency_contact: userData.emergencyContact,
    mpesa_consent: userData.mpesaConsent,
  })
  return response.data
}

/**
 * Update user profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise}
 */
export const updateProfile = async (profileData) => {
  const response = await apiClient.put('/auth/profile', profileData)
  // Update stored user data
  if (response.data.user) {
    localStorage.setItem('voltledger_user', JSON.stringify(response.data.user))
  }
  return response.data
}

/**
 * Logout user
 * @returns {Promise}
 */
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout')
  } finally {
    localStorage.removeItem('voltledger_token')
    localStorage.removeItem('voltledger_refresh_token')
    localStorage.removeItem('voltledger_user')
  }
}

/**
 * Get current user from localStorage
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('voltledger_user')
  return user ? JSON.parse(user) : null
}

/**
 * Get current auth token
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('voltledger_token')
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getToken()
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const hasRole = (role) => {
  const user = getCurrentUser()
  return user?.role === role
}

/**
 * Check if user is verified (KYC)
 * @returns {boolean}
 */
export const isVerified = () => {
  const user = getCurrentUser()
  return user?.id_verified === true
}
