import { MAPBOX_ACCESS_TOKEN as ENV_TOKEN } from '@env';

// Get Mapbox access token from environment variable
// This should be set in your .env file as MAPBOX_ACCESS_TOKEN=your_token_here
export const MAPBOX_ACCESS_TOKEN = ENV_TOKEN || '';

// Warn if no token is provided
if (!MAPBOX_ACCESS_TOKEN) {
  console.warn('MAPBOX_ACCESS_TOKEN not found in environment variables. Please set it in your .env file.');
}