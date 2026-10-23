// All server data fetching in one place, built on TanStack Query.
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from './api';

export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: () => api.get('/stats').then((r) => r.data) });
}

// params: { q, lat, lng, radiusKm, sort, limit }. Pass enabled: false to skip fetching.
export function useRoads(params = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['roads', params],
    enabled,
    queryFn: () => api.get('/roads', { params }).then((r) => r.data.roads),
    placeholderData: (prev) => prev, // keep showing old results while new ones load
  });
}

export function useRoad(id) {
  return useQuery({
    queryKey: ['road', id],
    queryFn: () => api.get(`/roads/${id}`).then((r) => r.data.road),
    enabled: !!id,
  });
}

// Infinite list of reviews. filters: { feed: 'all' | 'following', roadId, username }
export function useReviews(filters = {}, limit = 10) {
  return useInfiniteQuery({
    queryKey: ['reviews', filters],
    queryFn: ({ pageParam }) =>
      api.get('/reviews', { params: { ...filters, limit, cursor: pageParam } }).then((r) => r.data),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useReview(id) {
  return useQuery({ queryKey: ['review', id], queryFn: () => api.get(`/reviews/${id}`).then((r) => r.data.review) });
}

export function useComments(reviewId) {
  return useQuery({
    queryKey: ['comments', reviewId],
    queryFn: () => api.get(`/reviews/${reviewId}/comments`).then((r) => r.data.comments),
  });
}

export function useProfile(username) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then((r) => r.data.user),
    retry: false, // a 404 means the rider doesn't exist, no point retrying
  });
}

// Instagram-style photo posts of one rider
export function usePosts(username) {
  return useInfiniteQuery({
    queryKey: ['posts', username],
    queryFn: ({ pageParam }) => api.get('/posts', { params: { username, cursor: pageParam } }).then((r) => r.data),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function usePost(id) {
  return useQuery({ queryKey: ['post', id], queryFn: () => api.get(`/posts/${id}`).then((r) => r.data.post), enabled: !!id });
}

// Search riders by username or name (empty = most followed riders). Loads 21 at a time.
export function useUserSearch(q) {
  return useInfiniteQuery({
    queryKey: ['users', q],
    queryFn: ({ pageParam }) => api.get('/users', { params: { q: q || undefined, offset: pageParam } }).then((r) => r.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    placeholderData: (prev) => prev,
  });
}

// Road names from OpenStreetMap (all of India, Maharashtra ranked first)
export function useRoadSuggestions(q) {
  return useQuery({
    queryKey: ['geo-roads', q],
    queryFn: () => api.get('/geo/roads', { params: { q } }).then((r) => r.data),
    enabled: q.trim().length >= 2,
    staleTime: Infinity,
  });
}

// type: 'followers' | 'following'. Pass enabled: false to skip fetching until needed.
export function useFollowList(username, type, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['follows', username, type],
    queryFn: () => api.get(`/users/${username}/${type}`).then((r) => r.data.users),
    enabled,
  });
}
