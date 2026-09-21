/**
 * @fileoverview Axios API Client Configuration
 *
 * Central Axios instance for the Government Complaint Platform.
 * Handles JWT authentication via request/response interceptors:
 *  - Request: attaches the access token from localStorage.
 *  - Response: on 401, attempts a silent token refresh. If the refresh
 *    also fails, clears stored tokens and redirects to /login.
 *
 * The base URL is set to '/api' which is proxied to the Django backend
 * by the Vite dev server (see vite.config.js).
 *
 * @module services/api
 */

import axios from 'axios';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** @type {string} localStorage key for the JWT access token */
const ACCESS_TOKEN_KEY = 'access_token';

/** @type {string} localStorage key for the JWT refresh token */
const REFRESH_TOKEN_KEY = 'refresh_token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** @type {string} Endpoint used to obtain a new access token */
const REFRESH_ENDPOINT = `${API_BASE_URL}/auth/token/refresh/`;

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------

/**
 * Pre-configured Axios instance.
 * All service modules should import this instead of using `axios` directly.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor – Attach Access Token
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response Interceptor – Silent Token Refresh on 401
// ---------------------------------------------------------------------------

/**
 * Flag to prevent multiple concurrent refresh attempts when several
 * requests fail with 401 at the same time.
 * @type {boolean}
 */
let isRefreshing = false;

/**
 * Queue of callbacks waiting for the refresh to complete.
 * Each entry is an object with `resolve` and `reject` methods so the
 * original request can be retried (or rejected) once we know the outcome
 * of the token refresh.
 *
 * @type {Array<{ resolve: Function, reject: Function }>}
 */
let failedQueue = [];

/**
 * Process every queued request after a refresh attempt.
 *
 * @param {Error|null} error  - Non-null when the refresh itself failed.
 * @param {string|null} token - The new access token (null on failure).
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  // Successful responses pass through untouched.
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors that haven't already been retried and are
    // NOT the refresh request itself (to avoid infinite loops).
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== REFRESH_ENDPOINT
    ) {
      // If a refresh is already in progress, queue this request.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        // No refresh token available – force logout.
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(REFRESH_ENDPOINT, {
          refresh: refreshToken,
        });

        const newAccessToken = data.access;

        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

        // If the server also rotates refresh tokens, persist the new one.
        if (data.refresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
        }

        // Update the default header for future requests.
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        // Retry the original failed request with the new token.
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed – clear tokens and redirect to login.
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
