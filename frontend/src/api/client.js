import axios from 'axios';

const API_BASE = '/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s for LLM responses
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject API key if configured
client.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('rag_api_key');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

// Response interceptor: handle errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        console.warn('Authentication failed');
      } else if (status === 429) {
        console.warn('Rate limit exceeded');
      }

      return Promise.reject({
        status,
        message: data?.detail || 'An error occurred',
      });
    }

    return Promise.reject({
      status: 0,
      message: 'Network error — is the API server running?',
    });
  }
);

export async function queryAgent(query) {
  const response = await client.post('/query', { query });
  return response.data;
}

export async function triggerIngestion(dataDir = 'data/sample_docs', forceReingest = false) {
  const response = await client.post('/ingest', {
    data_dir: dataDir,
    force_reingest: forceReingest,
  });
  return response.data;
}

export async function checkHealth() {
  const response = await client.get('/health');
  return response.data;
}

export async function listDocuments() {
  const response = await client.get('/documents');
  return response.data;
}

export default client;
