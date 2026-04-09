/**
 * VoltLedger Loan Service
 * Book, extend, return loans
 */

import apiClient from './api'

/**
 * Get all loans for current user
 * @param {object} filters - Filter parameters
 * @returns {Promise} List of loans
 */
export const getMyLoans = async (filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.status) params.append('status', filters.status)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)
  
  const response = await apiClient.get(`/loans/my?${params.toString()}`)
  return response.data
}

/**
 * Get single loan details
 * @param {string} loanId - Loan UUID
 * @returns {Promise} Loan details
 */
export const getLoanById = async (loanId) => {
  const response = await apiClient.get(`/loans/${loanId}`)
  return response.data
}

/**
 * Get active loan for current user
 * @returns {Promise} Active loan or null
 */
export const getActiveLoan = async () => {
  const response = await apiClient.get('/loans/active')
  return response.data
}

/**
 * Book a new loan
 * @param {object} bookingData - Booking data
 * @returns {Promise} Created loan
 */
export const bookLoan = async (bookingData) => {
  const response = await apiClient.post('/loans', {
    bike_id: bookingData.bikeId,
    start_date: bookingData.startDate,
    end_date: bookingData.endDate,
    pickup_location_id: bookingData.pickupLocationId,
  })
  return response.data
}

/**
 * Extend active loan
 * @param {string} loanId - Loan UUID
 * @param {object} extensionData - Extension data
 * @returns {Promise} Updated loan
 */
export const extendLoan = async (loanId, extensionData) => {
  const response = await apiClient.post(`/loans/${loanId}/extend`, {
    new_end_date: extensionData.newEndDate,
    extension_days: extensionData.extensionDays,
  })
  return response.data
}

/**
 * Return bike and complete loan
 * @param {string} loanId - Loan UUID
 * @param {object} returnData - Return data
 * @returns {Promise} Completed loan
 */
export const returnBike = async (loanId, returnData) => {
  const response = await apiClient.post(`/loans/${loanId}/return`, {
    return_location_id: returnData.returnLocationId,
    condition_notes: returnData.conditionNotes,
    damage_reported: returnData.damageReported,
    damage_details: returnData.damageDetails,
    final_battery_pct: returnData.finalBatteryPct,
  })
  return response.data
}

/**
 * Cancel pending loan
 * @param {string} loanId - Loan UUID
 * @returns {Promise}
 */
export const cancelLoan = async (loanId) => {
  const response = await apiClient.post(`/loans/${loanId}/cancel`)
  return response.data
}

/**
 * Report issue with active loan
 * @param {string} loanId - Loan UUID
 * @param {object} issueData - Issue details
 * @returns {Promise}
 */
export const reportLoanIssue = async (loanId, issueData) => {
  const response = await apiClient.post(`/loans/${loanId}/issues`, {
    issue_type: issueData.issueType,
    description: issueData.description,
    severity: issueData.severity,
    location_lat: issueData.locationLat,
    location_lng: issueData.locationLng,
  })
  return response.data
}

/**
 * Get loan contract
 * @param {string} loanId - Loan UUID
 * @returns {Promise} Contract details
 */
export const getLoanContract = async (loanId) => {
  const response = await apiClient.get(`/loans/${loanId}/contract`)
  return response.data
}

/**
 * Accept loan contract
 * @param {string} loanId - Loan UUID
 * @returns {Promise}
 */
export const acceptContract = async (loanId) => {
  const response = await apiClient.post(`/loans/${loanId}/accept`)
  return response.data
}

/**
 * Get loan GPS tracking data
 * @param {string} loanId - Loan UUID
 * @param {object} params - Query params
 * @returns {Promise} GPS tracking data
 */
export const getLoanTracking = async (loanId, params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.from) queryParams.append('from', params.from)
  if (params.to) queryParams.append('to', params.to)
  
  const response = await apiClient.get(`/loans/${loanId}/tracking?${queryParams.toString()}`)
  return response.data
}

// Admin/Agent functions

/**
 * Get all loans (Admin/Agent only)
 * @param {object} filters - Filter parameters
 * @returns {Promise} List of all loans
 */
export const getAllLoans = async (filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.status) params.append('status', filters.status)
  if (filters.county) params.append('county', filters.county)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)
  
  const response = await apiClient.get(`/admin/loans?${params.toString()}`)
  return response.data
}

/**
 * Get overdue loans (Admin/Agent only)
 * @returns {Promise} List of overdue loans
 */
export const getOverdueLoans = async () => {
  const response = await apiClient.get('/admin/loans/overdue')
  return response.data
}
