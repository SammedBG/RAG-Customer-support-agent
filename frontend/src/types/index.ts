export interface Citation {
  source: string;
  chunk_text: string;
  relevance_score: number;
  page?: number | null;
}

export interface RagTraceStep {
  name: string;
  detail: string;
  status: 'pass' | 'fail' | 'info';
}

export interface RagTrace {
  isDemo?: boolean;
  originalQuery: string;
  queryRewrite?: string;
  denseCandidatesCount?: number;
  sparseCandidatesCount?: number;
  rrfCandidatesCount?: number;
  rerankedCount?: number;
  generationTokens?: number;
  groundingCheck?: 'PASS' | 'FAIL';
  totalLatencySeconds: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence?: number;
  timestamp: string;
  trace?: RagTrace;
  feedback?: 'like' | 'dislike' | null;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface DocumentChunkPreview {
  id: string;
  page?: number;
  text: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'PDF' | 'Markdown' | 'TXT' | 'DOCX';
  status: 'Indexed' | 'Processing' | 'Failed';
  chunksCount: number | null;
  lastIndexed: string;
  fileSize?: string;
  embeddingModel?: string;
  chunkingStrategy?: string;
  parentChunkSize?: number;
  childChunkSize?: number;
  overlapTokens?: number;
  previewChunks?: DocumentChunkPreview[];
}

export interface EvaluationMetrics {
  faithfulness: number | null;
  answerRelevancy: number | null;
  contextPrecision: number | null;
  contextRecall: number | null;
  datasetSize?: number;
  lastEvaluated?: string;
  modelName?: string;
  embeddingModel?: string;
  isEvaluated: boolean;
}

export interface EvaluationCase {
  id: string;
  question: string;
  expectedAnswer: string;
  generatedAnswer: string;
  expectedSource: string;
  retrievedSources: string[];
  retrievedContext: string;
  metrics: {
    faithfulness: number;
    answerRelevancy: number;
    contextPrecision: number;
    contextRecall: number;
  };
  status: 'PASS' | 'FAIL' | 'NOT RUN';
}

export interface HealthStatus {
  apiStatus: 'online' | 'offline';
  qdrantStatus: 'connected' | 'offline';
  modelName: string;
}
