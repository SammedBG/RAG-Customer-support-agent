import { apiClient } from './api';
import { DocumentItem } from '../types';

const INITIAL_MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-001',
    name: 'refund_policy.pdf',
    type: 'PDF',
    status: 'Indexed',
    chunksCount: 38,
    lastIndexed: '2 min ago',
    fileSize: '1.2 MB',
    embeddingModel: 'text-embedding-3-small',
    chunkingStrategy: 'Hierarchical Parent/Child',
    parentChunkSize: 1024,
    childChunkSize: 256,
    overlapTokens: 64,
    previewChunks: [
      {
        id: 'refund_001',
        page: 1,
        text: 'TechNova Customer Refund & Return Policy. Eligible items may be returned within 30 days of delivery for a full refund via original payment method.',
      },
      {
        id: 'refund_002',
        page: 2,
        text: 'Items must be unused and in original packaging. Opened software or digital activation codes are non-refundable unless defective.',
      },
      {
        id: 'refund_003',
        page: 3,
        text: 'Returns must be initiated via the TechNova Customer Portal. Once received at logistics, refunds are processed within 3-5 business days.',
      },
    ],
  },
  {
    id: 'doc-002',
    name: 'shipping_guide.md',
    type: 'Markdown',
    status: 'Indexed',
    chunksCount: 52,
    lastIndexed: '1 hour ago',
    fileSize: '485 KB',
    embeddingModel: 'text-embedding-3-small',
    chunkingStrategy: 'Hierarchical Parent/Child',
    parentChunkSize: 1024,
    childChunkSize: 256,
    overlapTokens: 64,
    previewChunks: [
      {
        id: 'shipping_001',
        page: 1,
        text: 'Shipping Methods & Rates: Standard Ground Shipping (3-5 business days) is free on orders over $50.00.',
      },
      {
        id: 'shipping_002',
        page: 2,
        text: 'Priority Overnight Shipping is offered at a flat rate of $19.99 for orders placed before 2:00 PM EST.',
      },
    ],
  },
  {
    id: 'doc-003',
    name: 'product_faq.md',
    type: 'Markdown',
    status: 'Indexed',
    chunksCount: 44,
    lastIndexed: '3 hours ago',
    fileSize: '310 KB',
    embeddingModel: 'text-embedding-3-small',
    chunkingStrategy: 'Hierarchical Parent/Child',
    parentChunkSize: 1024,
    childChunkSize: 256,
    overlapTokens: 64,
    previewChunks: [
      {
        id: 'faq_001',
        page: 1,
        text: 'SmartHome Hub Pro specifications: Quad-core ARM CPU, 2GB RAM, Wi-Fi 6, Thread, and Zigbee 3.0 support.',
      },
    ],
  },
  {
    id: 'doc-004',
    name: 'troubleshooting_guide.pdf',
    type: 'PDF',
    status: 'Processing',
    chunksCount: null,
    lastIndexed: 'Now',
    fileSize: '2.4 MB',
    embeddingModel: 'text-embedding-3-small',
    chunkingStrategy: 'Hierarchical Parent/Child',
    parentChunkSize: 1024,
    childChunkSize: 256,
    overlapTokens: 64,
    previewChunks: [],
  },
];

let mockDocuments = [...INITIAL_MOCK_DOCUMENTS];

export async function fetchDocuments(): Promise<DocumentItem[]> {
  try {
    const res = await apiClient.get('/documents');
    if (res.data && Array.isArray(res.data.documents)) {
      return res.data.documents;
    }
  } catch (err) {
    // Fallback to mock service
  }
  return mockDocuments;
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const extension = file.name.split('.').pop()?.toUpperCase() || 'TXT';
  const docType: DocumentItem['type'] =
    extension === 'PDF' ? 'PDF' : extension === 'MD' || extension === 'MARKDOWN' ? 'Markdown' : extension === 'DOCX' ? 'DOCX' : 'TXT';

  const newDoc: DocumentItem = {
    id: `doc-${Date.now()}`,
    name: file.name,
    type: docType,
    status: 'Indexed',
    chunksCount: Math.floor(Math.random() * 30) + 15,
    lastIndexed: 'Just now',
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    embeddingModel: 'text-embedding-3-small',
    chunkingStrategy: 'Hierarchical Parent/Child',
    parentChunkSize: 1024,
    childChunkSize: 256,
    overlapTokens: 64,
    previewChunks: [
      {
        id: `chunk_${Date.now()}_1`,
        page: 1,
        text: `Ingested content preview from uploaded document: ${file.name}. Processed with dual dense and BM25 sparse vector representation.`,
      },
    ],
  };

  try {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } catch (err) {
    // Save to mock storage if API offline
  }

  mockDocuments.unshift(newDoc);
  return newDoc;
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/documents/${id}`);
  } catch (err) {
    // Fallback
  }
  mockDocuments = mockDocuments.filter((doc) => doc.id !== id);
  return true;
}

export async function reindexDocument(id: string): Promise<boolean> {
  const doc = mockDocuments.find((d) => d.id === id);
  if (doc) {
    doc.status = 'Processing';
    setTimeout(() => {
      doc.status = 'Indexed';
      doc.lastIndexed = 'Just now';
    }, 1500);
  }
  return true;
}
