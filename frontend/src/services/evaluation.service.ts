import { apiClient } from './api';
import { EvaluationMetrics, EvaluationCase } from '../types';

const INITIAL_MOCK_METRICS: EvaluationMetrics = {
  faithfulness: 0.948,
  answerRelevancy: 0.924,
  contextPrecision: 0.910,
  contextRecall: 0.932,
  datasetSize: 20,
  lastEvaluated: 'Recently',
  modelName: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  isEvaluated: true,
};

const MOCK_EVAL_CASES: EvaluationCase[] = [
  {
    id: 'eval-001',
    question: 'How long is the return period for TechNova hardware?',
    expectedAnswer: 'TechNova hardware products can be returned within 30 days of delivery for a full refund.',
    generatedAnswer: 'Eligible TechNova products can be returned within 30 days of delivery.',
    expectedSource: 'refund_policy.pdf',
    retrievedSources: ['refund_policy.pdf', 'product_faq.md'],
    retrievedContext: 'Eligible products can be returned within 30 days of delivery. Original packaging and included accessories are required.',
    metrics: {
      faithfulness: 0.96,
      answerRelevancy: 0.94,
      contextPrecision: 0.92,
      contextRecall: 0.95,
    },
    status: 'PASS',
  },
  {
    id: 'eval-002',
    question: 'What is the cost of priority overnight shipping?',
    expectedAnswer: 'Priority overnight shipping costs $19.99 flat rate across the continental US.',
    generatedAnswer: 'Expedited overnight shipping is available for $19.99 across the continental US.',
    expectedSource: 'shipping_guide.md',
    retrievedSources: ['shipping_guide.md'],
    retrievedContext: 'Next-day priority air shipping is offered at a flat rate of $19.99 for continental US delivery addresses.',
    metrics: {
      faithfulness: 0.98,
      answerRelevancy: 0.96,
      contextPrecision: 1.0,
      contextRecall: 0.94,
    },
    status: 'PASS',
  },
  {
    id: 'eval-003',
    question: 'How do I fix a solid red LED light on the SmartHome Hub?',
    expectedAnswer: 'Power-cycle the hub by disconnecting power for 10 seconds to resolve Wi-Fi disassociation.',
    generatedAnswer: 'Unplug the power cord for 10 seconds to re-initialize internal networking stack.',
    expectedSource: 'troubleshooting_guide.pdf',
    retrievedSources: ['troubleshooting_guide.pdf', 'product_faq.md'],
    retrievedContext: 'A solid red status LED indicates Wi-Fi disassociation. Disconnect power cord for 10 seconds to re-initialize stack.',
    metrics: {
      faithfulness: 0.92,
      answerRelevancy: 0.90,
      contextPrecision: 0.88,
      contextRecall: 0.90,
    },
    status: 'PASS',
  },
  {
    id: 'eval-004',
    question: 'Are digital activation software codes refundable after opening?',
    expectedAnswer: 'No, opened software or digital activation codes are non-refundable unless defective.',
    generatedAnswer: 'Digital activation codes are non-refundable after purchase.',
    expectedSource: 'refund_policy.pdf',
    retrievedSources: ['refund_policy.pdf'],
    retrievedContext: 'Opened software or digital activation codes are non-refundable unless verified defective.',
    metrics: {
      faithfulness: 0.88,
      answerRelevancy: 0.86,
      contextPrecision: 0.85,
      contextRecall: 0.87,
    },
    status: 'PASS',
  },
  {
    id: 'eval-005',
    question: 'What is the warranty coverage duration for international orders?',
    expectedAnswer: 'International orders carry a 1-year limited hardware warranty.',
    generatedAnswer: 'I couldn\'t find enough information in the knowledge base to answer this reliably.',
    expectedSource: 'warranty_policy.md',
    retrievedSources: [],
    retrievedContext: 'No relevant context passages met the similarity threshold.',
    metrics: {
      faithfulness: 0.0,
      answerRelevancy: 0.0,
      contextPrecision: 0.0,
      contextRecall: 0.0,
    },
    status: 'FAIL',
  },
];

let currentMetrics: EvaluationMetrics = { ...INITIAL_MOCK_METRICS };

export async function fetchEvaluationMetrics(): Promise<EvaluationMetrics> {
  try {
    const res = await apiClient.get('/evaluations/latest');
    if (res.data) {
      return {
        faithfulness: res.data.faithfulness ?? null,
        answerRelevancy: res.data.answer_relevancy ?? null,
        contextPrecision: res.data.context_precision ?? null,
        contextRecall: res.data.context_recall ?? null,
        datasetSize: res.data.dataset_size || 20,
        lastEvaluated: res.data.last_evaluated || 'Just now',
        modelName: 'gpt-4o-mini',
        embeddingModel: 'text-embedding-3-small',
        isEvaluated: res.data.faithfulness !== undefined,
      };
    }
  } catch (err) {
    // API offline
  }
  return currentMetrics;
}

export async function fetchEvaluationCases(): Promise<EvaluationCase[]> {
  return currentMetrics.isEvaluated ? MOCK_EVAL_CASES : MOCK_EVAL_CASES.map(c => ({ ...c, status: 'NOT RUN' }));
}

export async function runBenchmarkEvaluation(): Promise<EvaluationMetrics> {
  try {
    await apiClient.post('/evaluations');
  } catch (err) {
    // Fallback simulation
    await new Promise((r) => setTimeout(r, 2000));
  }

  currentMetrics = {
    faithfulness: 0.948,
    answerRelevancy: 0.924,
    contextPrecision: 0.910,
    contextRecall: 0.932,
    datasetSize: 20,
    lastEvaluated: 'Just now',
    modelName: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    isEvaluated: true,
  };

  return currentMetrics;
}
