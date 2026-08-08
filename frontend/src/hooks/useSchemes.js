/**
 * @fileoverview Government Scheme React Query Hooks
 *
 * Custom hooks for fetching government welfare schemes with TanStack
 * React Query. Supports paginated listing with filters and single
 * scheme detail views.
 *
 * ## Query Key Conventions
 * | Hook        | Key                     |
 * |-------------|-------------------------|
 * | useSchemes  | `['schemes', params]`   |
 * | useScheme   | `['schemes', id]`       |
 *
 * @module hooks/useSchemes
 */

import { useQuery } from '@tanstack/react-query';
import * as schemeService from '../services/schemeService';

// ═══════════════════════════════════════════════════════════════════════════
// Query Hooks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch a paginated, filterable list of government schemes.
 *
 * @param {Object}  [params]            - Query parameters forwarded to the API.
 * @param {string}  [params.search]     - Free-text search.
 * @param {string}  [params.department] - Department filter.
 * @param {string}  [params.state]      - State filter.
 * @param {string}  [params.category]   - Category filter.
 * @param {number}  [params.page]       - Page number.
 * @returns {import('@tanstack/react-query').UseQueryResult}
 *
 * @example
 * const { data, isLoading, isError } = useSchemes({ search: 'housing', page: 1 });
 */
export const useSchemes = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ['schemes', params],
    queryFn: () => schemeService.getSchemes(params),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes — scheme data changes infrequently
    ...options,
  });
};

/**
 * Fetch a single government scheme by its ID.
 *
 * The query is disabled when `id` is falsy so it can be called
 * unconditionally in components that may not have a route param yet.
 *
 * @param {number|string|null} id - Scheme primary key.
 * @returns {import('@tanstack/react-query').UseQueryResult}
 *
 * @example
 * const { id } = useParams();
 * const { data: scheme, isLoading } = useScheme(id);
 */
export const useScheme = (id) => {
  return useQuery({
    queryKey: ['schemes', id],
    queryFn: () => schemeService.getScheme(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};
