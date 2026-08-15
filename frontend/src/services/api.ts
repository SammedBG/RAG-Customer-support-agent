/// <reference types="vite/client" />
import axios from 'axios';
import { HealthStatus } from '../types';

// Prefer relative '/api/v1' to use Vercel's edge proxy rewrite (bypasses browser CORS)
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const API_BASE_URL = rawBaseUrl.startsWith('http') && window.location.hostname.includes('vercel.app')
  ? '/api/v1'
  : rawBaseUrl;
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-key-change-me-in-production';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
  timeout: 30000, // 30s to handle Render free-tier cold starts
});

export async function checkSystemHealth(): Promise<HealthStatus> {
  try {
    const res = await apiClient.get('/health');
    return {
      apiStatus: 'online',
      qdrantStatus: res.data.qdrant_connected ? 'connected' : 'offline',
      modelName: 'gpt-4o-mini',
    };
  } catch (error) {
    return {
      apiStatus: 'offline',
      qdrantStatus: 'offline',
      modelName: 'gpt-4o-mini',
    };
  }
}
