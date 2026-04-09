/**
 * VoltLedger Bike Store
 * Zustand state management for bike inventory
 */

import { create } from 'zustand'
import * as bikeService from '../services/bikes'

const useBikeStore = create((set, get) => ({
  // State
  bikes: [],
  selectedBike: null,
  counties: [],
  wards: [],
  isLoading: false,
  error: null,
  filters: {
    county: null,
    ward: null,
    status: 'available',
  },

  // Actions
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  
  clearFilters: () => set({ 
    filters: { county: null, ward: null, status: 'available' } 
  }),

  fetchBikes: async (customFilters = null) => {
    set({ isLoading: true, error: null })
    try {
      const filters = customFilters || get().filters
      const data = await bikeService.getBikes(filters)
      set({ bikes: data.bikes || data, isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch bikes', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  fetchBikeById: async (bikeId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await bikeService.getBikeById(bikeId)
      set({ selectedBike: data, isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch bike details', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  fetchCounties: async () => {
    try {
      const data = await bikeService.getCountiesWithBikes()
      set({ counties: data.counties || data })
      return { success: true, data }
    } catch (error) {
      set({ error: error.response?.data?.message })
      return { success: false }
    }
  },

  fetchWards: async (county) => {
    try {
      const data = await bikeService.getWardsByCounty(county)
      set({ wards: data.wards || data })
      return { success: true, data }
    } catch (error) {
      set({ error: error.response?.data?.message })
      return { success: false }
    }
  },

  searchNearby: async (latitude, longitude, radiusKm = 10) => {
    set({ isLoading: true, error: null })
    try {
      const data = await bikeService.searchBikesByLocation(latitude, longitude, radiusKm)
      set({ bikes: data.bikes || data, isLoading: false })
      return { success: true, data }
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to search bikes', 
        isLoading: false 
      })
      return { success: false, error: error.response?.data?.message }
    }
  },

  checkAvailability: async (bikeId, startDate, endDate) => {
    try {
      const data = await bikeService.checkBikeAvailability(bikeId, startDate, endDate)
      return { success: true, available: data.available, data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to check availability' 
      }
    }
  },

  selectBike: (bike) => set({ selectedBike: bike }),
  
  clearSelectedBike: () => set({ selectedBike: null }),

  clearError: () => set({ error: null }),
}))

export default useBikeStore
