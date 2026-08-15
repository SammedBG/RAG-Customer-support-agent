import { apiClient } from './api';
import { EvaluationMetrics, EvaluationCase } from '../types';

const EMPTY_METRICS: EvaluationMetrics = {
  faithfulness: null,
  answerRelevancy: null,
  contextPrecision: null,
  contextRecall: null,
  datasetSize: 0,
  lastEvaluated: 'Not evaluated yet',
  modelName: 'llama-3.3-70b-versatile',
  embeddingModel: 'BAAI/bge-small-en-v1.5',
  isEvaluated: false,
};

export async function fetchEvaluationMetrics(): Promise<EvaluationMetrics> {
  try {
    const res = await apiClient.get('/evaluations/latest');
    if (res.data && res.data.faithfulness !== undefined) {
      return {
        faithfulness: res.data.faithfulness,
        answerRelevancy: res.data.answer_relevancy,
        contextPrecision: res.data.context_precision,
        contextRecall: res.data.context_recall,
        datasetSize: res.data.dataset_size || 20,
        lastEvaluated: res.data.last_evaluated || 'Just now',
        modelName: 'llama-3.3-70b-versatile',
        embeddingModel: 'BAAI/bge-small-en-v1.5',
        isEvaluated: true,
      };
    }
  } catch (err) {
    // API offline — return empty metrics
  }
  return { ...EMPTY_METRICS };
}

export async function fetchEvaluationCases(): Promise<EvaluationCase[]> {
  return [];
}

export async function runBenchmarkEvaluation(): Promise<EvaluationMetrics> {
  const res = await apiClient.post('/evaluations');
  if (res.data) {
    return {
      faithfulness: res.data.faithfulness,
      answerRelevancy: res.data.answer_relevancy,
      contextPrecision: res.data.context_precision,
      contextRecall: res.data.context_recall,
      datasetSize: res.data.dataset_size || 20,
      lastEvaluated: 'Just now',
      modelName: 'llama-3.3-70b-versatile',
      embeddingModel: 'BAAI/bge-small-en-v1.5',
      isEvaluated: true,
    };
  }
  return { ...EMPTY_METRICS };
}
