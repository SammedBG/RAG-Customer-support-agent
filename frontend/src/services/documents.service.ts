import { apiClient } from './api';
import { DocumentItem } from '../types';

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await apiClient.get('/documents');
  if (res.data && Array.isArray(res.data.documents)) {
    return res.data.documents;
  }
  return [];
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/documents', formData);
  return res.data;
}

export async function deleteDocument(id: string, name?: string): Promise<boolean> {
  const target = name || id;
  await apiClient.delete(`/documents/${target}`);
  return true;
}

export async function reindexDocument(id: string, name?: string): Promise<boolean> {
  const target = name || id;
  await apiClient.post(`/documents/${target}/reindex`);
  return true;
}

export async function deleteAllDocuments(): Promise<{ message: string; details: string[] }> {
  const res = await apiClient.delete('/documents');
  return res.data;
}
