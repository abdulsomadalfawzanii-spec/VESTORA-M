import { Platform } from 'react-native';

const localApiBase =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

export const apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_URL || localApiBase
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body === undefined || isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
  });

  const responseText = response.status === 204 ? '' : await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new ApiError('The API returned an invalid response.', response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error ?? `The request failed (${response.status}).`,
      response.status,
    );
  }

  return data;
}
