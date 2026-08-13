/**
 * @fileoverview Complaint Service
 *
 * Encapsulates all complaint-related API operations: listing (with
 * filtering / pagination), CRUD, and image upload.
 *
 * Every function returns `response.data` so consumers never need to
 * unwrap the Axios response object themselves.
 *
 * @module services/complaintService
 */

import api from './api';

// ---------------------------------------------------------------------------
// List Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated, filterable list of all complaints.
 *
 * @param {Object}  [params]           - Query parameters.
 * @param {string}  [params.search]    - Free-text search term.
 * @param {string}  [params.status]    - Filter by status (e.g. "pending").
 * @param {string}  [params.priority]  - Filter by priority (e.g. "high").
 * @param {number}  [params.page]      - Page number (1-based).
 * @param {string}  [params.ordering]  - Ordering field (prefix `-` for desc).
 * @returns {Promise<Object>} Paginated response `{ count, next, previous, results }`.
 */
export const getComplaints = async (params = {}) => {
  const response = await api.get('/complaints/', { params });
  return response.data;
};

/**
 * Fetch a paginated list of the current user's own complaints.
 *
 * @param {Object}  [params]           - Query parameters (same as getComplaints).
 * @param {string}  [params.search]    - Free-text search term.
 * @param {string}  [params.status]    - Filter by status.
 * @param {string}  [params.priority]  - Filter by priority.
 * @param {number}  [params.page]      - Page number.
 * @param {string}  [params.ordering]  - Ordering field.
 * @returns {Promise<Object>} Paginated response.
 */
export const getMyComplaints = async (params = {}) => {
  const response = await api.get('/complaints/my/', { params });
  return response.data;
};

// ---------------------------------------------------------------------------
// Detail / CRUD
// ---------------------------------------------------------------------------

/**
 * Fetch a single complaint by its ID.
 *
 * @param {number|string} id - Complaint primary key.
 * @returns {Promise<Object>} Full complaint object.
 */
export const getComplaint = async (id) => {
  const response = await api.get(`/complaints/${id}/`);
  return response.data;
};

/**
 * Create a new complaint.
 *
 * @param {Object} data - Complaint payload.
 * @param {string} data.title       - Complaint title.
 * @param {string} data.description - Detailed description.
 * @param {string} [data.category]  - Category slug.
 * @param {string} [data.priority]  - Priority level ("low" | "medium" | "high").
 * @param {string} [data.state]     - Indian state.
 * @param {string} [data.district]  - District name.
 * @param {string} [data.department]- Government department.
 * @returns {Promise<Object>} The newly created complaint.
 */
export const createComplaint = async (data) => {
  const response = await api.post('/complaints/create/', data);
  return response.data;
};

/**
 * Partially update an existing complaint.
 *
 * @param {number|string} id   - Complaint primary key.
 * @param {Object}        data - Fields to update (PATCH semantics).
 * @returns {Promise<Object>} The updated complaint.
 */
export const updateComplaint = async (id, data) => {
  const response = await api.patch(`/complaints/${id}/update/`, data);
  return response.data;
};

/**
 * Delete a complaint.
 *
 * @param {number|string} id - Complaint primary key.
 * @returns {Promise<Object>} Server confirmation (may be empty on 204).
 */
export const deleteComplaint = async (id) => {
  const response = await api.delete(`/complaints/${id}/delete/`);
  return response.data;
};

// ---------------------------------------------------------------------------
// Image Upload
// ---------------------------------------------------------------------------

/**
 * Upload one or more images for a complaint.
 *
 * The caller should construct a `FormData` object and append files under
 * the key expected by the backend (typically `"images"`).
 *
 * @param {number|string} id       - Complaint primary key.
 * @param {FormData}      formData - FormData with image files.
 * @returns {Promise<Object>} Server response with uploaded image details.
 */
export const uploadImages = async (id, formData) => {
  const response = await api.post(
    `/complaints/${id}/upload-images/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/complaints/categories/');
  return response.data;
};

export const getDepartments = async () => {
  const response = await api.get('/complaints/departments/');
  return response.data;
};

export const supportComplaint = async (id) => {
  const response = await api.post(`/complaints/${id}/support/`);
  return response.data;
};

export const checkDuplicateComplaint = async (data) => {
  const response = await api.post('/complaints/check-duplicate/', data);
  return response.data;
};

const complaintService = {
  getComplaints,
  getMyComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  uploadImages,
  getCategories,
  getDepartments,
  supportComplaint,
  checkDuplicateComplaint,
};

export default complaintService;
