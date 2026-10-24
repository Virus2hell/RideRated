import axios from 'axios';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? ''; // empty in dev (Vite proxy), set in production

// withCredentials sends the httpOnly auth cookie with every request.
export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

// Photos are stored as "/uploads/abc.jpg"; turn them into full URLs.
export function mediaUrl(url) {
  if (!url) return url;
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}

// Pull a readable message out of an API error.
export function errorMessage(err) {
  const status = err?.response?.status;
  // 502/503/504 = the free server is waking up (it sleeps after 15 min without visitors)
  if (!err?.response || [502, 503, 504].includes(status)) {
    return 'The server is waking up. Please try again in about 30 seconds.';
  }
  return err.response.data?.error ?? 'Something went wrong. Please try again.';
}

// Field-level validation errors from the API, e.g. { email: ['Invalid email address'] }
export function fieldErrors(err) {
  return err?.response?.data?.details ?? {};
}