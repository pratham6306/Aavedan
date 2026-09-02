import api from './api';

/**
 * Fetch all available states from the backend.
 * @returns {Promise<Array>} List of state objects.
 */
export const getStates = async () => {
  const response = await api.get('/locations/states/');
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results || []);
};

/**
 * Fetch districts for a specific state.
 * @param {number|string} stateId - Database ID of the state.
 * @returns {Promise<Array>} List of district objects.
 */
export const getDistricts = async (stateId) => {
  if (!stateId) return [];
  const response = await api.get('/locations/districts/', {
    params: { state_id: stateId }
  });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results || []);
};

const locationService = {
  getStates,
  getDistricts
};

export default locationService;
