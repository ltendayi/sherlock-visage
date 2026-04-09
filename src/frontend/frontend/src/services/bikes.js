/**
 * VoltLedger Bike Service
 * Fetch bikes by location and manage inventory
 */

import apiClient from './api'

/**
 * Get all available bikes with optional filters
 * @param {object} filters - Filter parameters
 * @returns {Promise} List of bikes
 */
export const getBikes = async (filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.county) params.append('county', filters.county)
  if (filters.ward) params.append('ward', filters.ward)
  if (filters.status) params.append('status', filters.status)
  if (filters.minRate) params.append('min_rate', filters.minRate)
  if (filters.maxRate) params.append('max_rate', filters.maxRate)
  if (filters.latitude && filters.longitude) {
    params.append('lat', filters.latitude)
    params.append('lng', filters.longitude)
  }
  
  const response = await apiClient.get(`/bikes?${params.toString()}`)
  return response.data
}

/**
 * Get single bike details
 * @param {string} bikeId - Bike UUID
 * @returns {Promise} Bike details
 */
export const getBikeById = async (bikeId) => {
  const response = await apiClient.get(`/bikes/${bikeId}`)
  return response.data
}

/**
 * Get bike by serial number
 * @param {string} serialNumber - Bike serial number
 * @returns {Promise} Bike details
 */
export const getBikeBySerial = async (serialNumber) => {
  const response = await apiClient.get(`/bikes/serial/${serialNumber}`)
  return response.data
}

/**
 * Get all counties with available bikes
 * @returns {Promise} List of counties
 */
export const getCountiesWithBikes = async () => {
  const response = await apiClient.get('/bikes/locations/counties')
  return response.data
}

/**
 * Get wards by county
 * @param {string} county - County name
 * @returns {Promise} List of wards
 */
export const getWardsByCounty = async (county) => {
  const response = await apiClient.get(`/bikes/locations/wards?county=${encodeURIComponent(county)}`)
  return response.data
}

/**
 * Search bikes by location
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {number} radiusKm - Search radius in km (default 10)
 * @returns {Promise} Bikes sorted by distance
 */
export const searchBikesByLocation = async (latitude, longitude, radiusKm = 10) => {
  const response = await apiClient.get(
    `/bikes/search/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`
  )
  return response.data
}

/**
 * Get bike health/status
 * @param {string} bikeId - Bike UUID
 * @returns {Promise} Bike health data
 */
export const getBikeHealth = async (bikeId) => {
  const response = await apiClient.get(`/bikes/${bikeId}/health`)
  return response.data
}

/**
 * Get bike maintenance history
 * @param {string} bikeId - Bike UUID
 * @returns {Promise} Maintenance records
 */
export const getBikeMaintenanceHistory = async (bikeId) => {
  const response = await apiClient.get(`/bikes/${bikeId}/maintenance`)
  return response.data
}

/**
 * Report bike issue (Agent/Admin only)
 * @param {string} bikeId - Bike UUID
 * @param {object} issueData - Issue details
 * @returns {Promise}
 */
export const reportBikeIssue = async (bikeId, issueData) => {
  const response = await apiClient.post(`/bikes/${bikeId}/issues`, issueData)
  return response.data
}

/**
 * Check bike availability for date range
 * @param {string} bikeId - Bike UUID
 * @param {string} startDate - Start date (ISO)
 * @param {string} endDate - End date (ISO)
 * @returns {Promise} Availability status
 */
export const checkBikeAvailability = async (bikeId, startDate, endDate) => {
  const response = await apiClient.get(
    `/bikes/${bikeId}/availability?start=${startDate}&end=${endDate}`
  )
  return response.data
}
