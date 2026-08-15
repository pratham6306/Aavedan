/**
 * @fileoverview Authentication Context Provider
 *
 * Provides global authentication state and actions to the entire React
 * component tree. Uses React Context + `useReducer` for predictable
 * state transitions.
 *
 * ## Provided Values
 * | Key              | Type     | Description                              |
 * |------------------|----------|------------------------------------------|
 * | `user`           | Object   | Current user profile (null when logged out) |
 * | `loading`        | boolean  | True while the initial auth check runs   |
 * | `isAuthenticated`| boolean  | Shorthand for `!!user`                   |
 * | `login`          | Function | Authenticate and fetch profile            |
 * | `logout`         | Function | Sign out and redirect to /login           |
 * | `register`       | Function | Create account, auto-login, fetch profile |
 * | `updateProfile`  | Function | Patch profile and update local state      |
 *
 * @module context/AuthContext
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as authService from '../services/authService';

// ═══════════════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} AuthState
 * @property {Object|null} user    - Authenticated user profile.
 * @property {boolean}     loading - True during initial token verification.
 */

/** @type {React.Context<AuthState & AuthActions>} */
const AuthContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════
// Reducer
// ═══════════════════════════════════════════════════════════════════════════

/** @enum {string} Action types */
const ActionTypes = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
};

/** @type {AuthState} */
const initialState = {
  user: null,
  loading: true,
};

/**
 * Authentication reducer.
 *
 * @param {AuthState} state  - Current state.
 * @param {{ type: string, payload?: any }} action - Dispatched action.
 * @returns {AuthState} Next state.
 */
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.AUTH_START:
      return { ...state, loading: true };

    case ActionTypes.AUTH_SUCCESS:
      return { user: action.payload, loading: false };

    case ActionTypes.AUTH_FAILURE:
      return { user: null, loading: false };

    case ActionTypes.LOGOUT:
      return { user: null, loading: false };

    case ActionTypes.UPDATE_USER:
      return { ...state, user: action.payload };

    default:
      return state;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Provider
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AuthProvider – wrap your app (or a subtree) with this component to
 * make authentication state and actions available via `useAuth()`.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactElement}
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // -----------------------------------------------------------------------
  // Initial auth check – runs once on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        dispatch({ type: ActionTypes.AUTH_FAILURE });
        return;
      }

      try {
        const profile = await authService.getProfile();
        dispatch({ type: ActionTypes.AUTH_SUCCESS, payload: profile });
      } catch {
        // Token might be expired – the Axios interceptor will attempt a
        // refresh automatically. If that also fails, the interceptor
        // redirects to /login and clears storage, so we just mark the
        // auth check as complete here.
        dispatch({ type: ActionTypes.AUTH_FAILURE });
      }
    };

    initializeAuth();
  }, []);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  /**
   * Log in with email & password.
   *
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @returns {Promise<Object>} User profile on success.
   * @throws {Error} Re-throws API errors for the caller to handle.
   */
  const login = useCallback(async (credentials) => {
    dispatch({ type: ActionTypes.AUTH_START });

    try {
      await authService.login(credentials);
      const profile = await authService.getProfile();
      dispatch({ type: ActionTypes.AUTH_SUCCESS, payload: profile });
      toast.success('Welcome back!');
      return profile;
    } catch (error) {
      dispatch({ type: ActionTypes.AUTH_FAILURE });
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Login failed. Please check your credentials.';
      toast.error(message);
      throw error;
    }
  }, []);

  /**
   * Register a new account.
   *
   * @param {Object} data - Registration form data.
   * @returns {Promise<Object>} User profile on success.
   * @throws {Error} Re-throws API errors for the caller to handle.
   */
  const register = useCallback(async (data) => {
    dispatch({ type: ActionTypes.AUTH_START });

    try {
      // Create the account and get profile/tokens.
      await authService.register(data);

      const profile = await authService.getProfile();
      dispatch({ type: ActionTypes.AUTH_SUCCESS, payload: profile });
      toast.success('Account created successfully!');
      return profile;
    } catch (error) {
      dispatch({ type: ActionTypes.AUTH_FAILURE });

      // The backend may return field-level errors (e.g. { email: [...] }).
      const errorData = error.response?.data;
      let message = 'Registration failed. Please try again.';

      if (typeof errorData === 'string') {
        message = errorData;
      } else if (errorData?.detail) {
        message = errorData.detail;
      } else if (errorData) {
        // Flatten field errors into a single string.
        const fieldErrors = Object.entries(errorData)
          .map(([field, errors]) => {
            const msgs = Array.isArray(errors) ? errors.join(', ') : errors;
            return `${field}: ${msgs}`;
          })
          .join('; ');
        if (fieldErrors) message = fieldErrors;
      }

      toast.error(message);
      throw error;
    }
  }, []);

  /**
   * Log in via phone OTP verification.
   *
   * @param {Object} credentials
   * @param {string} credentials.phone
   * @param {string} credentials.otp
   * @returns {Promise<Object>} User profile on success.
   */
  const loginWithOTP = useCallback(async (credentials) => {
    dispatch({ type: ActionTypes.AUTH_START });

    try {
      await authService.verifyOTP(credentials);
      const profile = await authService.getProfile();
      dispatch({ type: ActionTypes.AUTH_SUCCESS, payload: profile });
      toast.success('Welcome back!');
      return profile;
    } catch (error) {
      dispatch({ type: ActionTypes.AUTH_FAILURE });
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'OTP validation failed. Please check the code.';
      toast.error(message);
      throw error;
    }
  }, []);

  /**
   * Log the current user out and redirect to the login page.
   *
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logout API failure is non-critical – local cleanup still happens.
    } finally {
      dispatch({ type: ActionTypes.LOGOUT });
      toast.info('You have been logged out.');
      navigate('/login');
    }
  }, [navigate]);

  /**
   * Partially update the current user's profile.
   *
   * @param {Object} data - Fields to update (PATCH semantics).
   * @returns {Promise<Object>} Updated profile.
   * @throws {Error} Re-throws API errors for the caller to handle.
   */
  const updateProfile = useCallback(async (data) => {
    try {
      const updatedProfile = await authService.updateProfile(data);
      dispatch({ type: ActionTypes.UPDATE_USER, payload: updatedProfile });
      toast.success('Profile updated successfully!');
      return updatedProfile;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to update profile.';
      toast.error(message);
      throw error;
    }
  }, []);

  // -----------------------------------------------------------------------
  // Memoised context value
  // -----------------------------------------------------------------------

  const loginWithTokens = useCallback((access, refresh, userProfile) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    dispatch({ type: ActionTypes.AUTH_SUCCESS, payload: userProfile });
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      loading: state.loading,
      isAuthenticated: !!state.user,
      login,
      loginWithOTP,
      loginWithTokens,
      logout,
      register,
      updateProfile,
    }),
    [state.user, state.loading, login, loginWithOTP, loginWithTokens, logout, register, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Consume the authentication context.
 *
 * Must be called within a component wrapped by `<AuthProvider>`.
 *
 * @returns {{ user: Object|null, loading: boolean, isAuthenticated: boolean, login: Function, logout: Function, register: Function, updateProfile: Function }}
 * @throws {Error} If called outside an AuthProvider.
 *
 * @example
 * const { user, isAuthenticated, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an <AuthProvider>. ' +
        'Wrap your component tree with <AuthProvider> in your app root.',
    );
  }

  return context;
};

export default AuthContext;
