/// <reference types="vite/client" />
import axios from 'axios';
import { HealthStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'dev-key-change-me-in-production',
  },
  timeout: 10000,
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
