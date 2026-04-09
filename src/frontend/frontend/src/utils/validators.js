/**
 * VoltLedger Validation Utilities
 * Kenyan market specific validators
 */

import { KENYA_PHONE_REGEX } from '../styles/theme'

/**
 * Validate Kenyan phone number (2547XXXXXXXX format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export const validateKenyanPhone = (phone) => {
  if (!phone) return false
  // Remove any spaces or dashes
  const cleanPhone = phone.replace(/[\s-]/g, '')
  return KENYA_PHONE_REGEX.test(cleanPhone)
}

/**
 * Format phone number to Kenyan format (2547XXXXXXXX)
 * @param {string} phone - Phone number to format
 * @returns {string}
 */
export const formatKenyanPhone = (phone) => {
  if (!phone) return ''
  // Remove all non-digits
  let cleanPhone = phone.replace(/\D/g, '')
  
  // Remove leading 0 and replace with 254
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.substring(1)
  }
  
  // If starts with 7, add 254
  if (cleanPhone.startsWith('7')) {
    cleanPhone = '254' + cleanPhone
  }
  
  // If starts with +, remove it
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1)
  }
  
  return cleanPhone
}

/**
 * Format phone for display (07XX XXX XXX)
 * @param {string} phone - Phone number
 * @returns {string}
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return ''
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length === 12 && cleanPhone.startsWith('254')) {
    const localPart = cleanPhone.substring(3)
    return `0${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`
  }
  
  return phone
}

/**
 * Validate Kenyan National ID (Huduma Namba or old ID)
 * @param {string} idNumber - ID number to validate
 * @returns {boolean}
 */
export const validateKenyanID = (idNumber) => {
  if (!idNumber) return false
  const cleanID = idNumber.replace(/\s/g, '')
  // Huduma Namba: 8-9 digits
  // Old ID: 8 digits
  const idRegex = /^\d{8,9}$/
  return idRegex.test(cleanID)
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate amount is positive number
 * @param {number} amount - Amount to validate
 * @returns {boolean}
 */
export const validateAmount = (amount) => {
  const num = Number(amount)
  return !isNaN(num) && num > 0
}

/**
 * Validate date range for loan booking
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {object} - { valid: boolean, message: string }
 */
export const validateDateRange = (startDate, endDate) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)
  
  if (start < now) {
    return { valid: false, message: 'Start date cannot be in the past' }
  }
  
  if (end <= start) {
    return { valid: false, message: 'End date must be after start date' }
  }
  
  const maxDays = 14
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  
  if (daysDiff > maxDays) {
    return { valid: false, message: `Maximum loan period is ${maxDays} days` }
  }
  
  return { valid: true, message: '' }
}

/**
 * Calculate loan total
 * @param {number} dailyRate - Daily rate in KES
 * @param {number} days - Number of days
 * @param {number} deposit - Deposit amount (default 2000)
 * @returns {object} - { dailyTotal, deposit, total }
 */
export const calculateLoanTotal = (dailyRate, days, deposit = 2000) => {
  const dailyTotal = dailyRate * days
  return {
    dailyTotal,
    deposit,
    total: dailyTotal + deposit,
    days,
  }
}

/**
 * Format currency (KES)
 * @param {number} amount - Amount to format
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'KES 0'
  return `KES ${Number(amount).toLocaleString('en-KE')}`
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
