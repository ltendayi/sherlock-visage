/**
 * Decimal.js-based token-to-USD conversion service
 * Provides precise financial calculations for AI token usage
 */

import Decimal from 'decimal.js';

// Model pricing data (cost per 1M tokens) - APPROVED MODELS ONLY
export const MODEL_PRICING: Record<string, {
  inputCostPer1M: Decimal;
  outputCostPer1M: Decimal;
  contextWindow: number;
}> = {
  'DeepSeek-V3.2': {
    inputCostPer1M: new Decimal('0.14'),
    outputCostPer1M: new Decimal('0.56'),
    contextWindow: 128000
  },
  'gpt-4o': {
    inputCostPer1M: new Decimal('2.50'),
    outputCostPer1M: new Decimal('10.00'),
    contextWindow: 128000
  },
  'grok-4-1-fast-non-reasoning': {
    inputCostPer1M: new Decimal('0.15'),
    outputCostPer1M: new Decimal('0.60'),
    contextWindow: 128000
  },
  'grok-4-fast-reasoning': {
    inputCostPer1M: new Decimal('0.50'),
    outputCostPer1M: new Decimal('2.00'),
    contextWindow: 128000
  },
  'text-embedding-3-small': {
    inputCostPer1M: new Decimal('0.02'),
    outputCostPer1M: new Decimal('0.02'),
    contextWindow: 8192
  },
  'Kimi-K2.5': {
    inputCostPer1M: new Decimal('0.10'),
    outputCostPer1M: new Decimal('0.40'),
    contextWindow: 200000
  },
  'DeepSeek-R1': {
    inputCostPer1M: new Decimal('0.55'),
    outputCostPer1M: new Decimal('2.19'),
    contextWindow: 64000
  },
  'gpt-4.1-mini': {
    inputCostPer1M: new Decimal('0.40'),
    outputCostPer1M: new Decimal('1.60'),
    contextWindow: 128000
  },
  'gpt-4.1': {
    inputCostPer1M: new Decimal('2.00'),
    outputCostPer1M: new Decimal('8.00'),
    contextWindow: 128000
  },
  'gpt-5-nano': {
    inputCostPer1M: new Decimal('0.10'),
    outputCostPer1M: new Decimal('0.40'),
    contextWindow: 128000
  },
  'gpt-5.4-mini': {
    inputCostPer1M: new Decimal('0.50'),
    outputCostPer1M: new Decimal('2.00'),
    contextWindow: 128000
  },
  'gpt-5.4-nano': {
    inputCostPer1M: new Decimal('0.15'),
    outputCostPer1M: new Decimal('0.60'),
    contextWindow: 128000
  },
  'Llama-3.3-70B-Instruct': {
    inputCostPer1M: new Decimal('0.20'),
    outputCostPer1M: new Decimal('0.80'),
    contextWindow: 128000
  },
  'Llama-4-Maverick-17B-128E-Instruct-FP8': {
    inputCostPer1M: new Decimal('0.25'),
    outputCostPer1M: new Decimal('1.00'),
    contextWindow: 128000
  },
  'Mistral-Large-3': {
    inputCostPer1M: new Decimal('1.00'),
    outputCostPer1M: new Decimal('3.00'),
    contextWindow: 128000
  },
  'codex-mini': {
    inputCostPer1M: new Decimal('0.30'),
    outputCostPer1M: new Decimal('1.20'),
    contextWindow: 128000
  },
  'gpt-5.1-codex-mini': {
    inputCostPer1M: new Decimal('0.35'),
    outputCostPer1M: new Decimal('1.40'),
    contextWindow: 128000
  }
};

/**
 * Calculate cost in USD for token usage
 * @param model - The model name
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Decimal - Cost in USD
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): Decimal {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const inputCost = pricing.inputCostPer1M
    .times(inputTokens)
    .dividedBy(1_000_000);
  
  const outputCost = pricing.outputCostPer1M
    .times(outputTokens)
    .dividedBy(1_000_000);

  return inputCost.plus(outputCost);
}

/**
 * Format cost for display
 * @param cost - Decimal cost value
 * @param precision - Number of decimal places (default: 6)
 * @returns string - Formatted cost string
 */
export function formatCost(cost: Decimal, precision: number = 6): string {
  return `$${cost.toFixed(precision)}`;
}

/**
 * Get budget tier for a model
 * @param model - The model name
 * @returns 'low' | 'medium' | 'high' | 'critical'
 */
export function getBudgetTier(model: string): 'low' | 'medium' | 'high' | 'critical' {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 'medium';

  const inputCost = pricing.inputCostPer1M.toNumber();
  
  if (inputCost <= 0.15) return 'low';
  if (inputCost <= 0.60) return 'medium';
  if (inputCost <= 1.50) return 'high';
  return 'critical';
}

/**
 * Check if a model requires approval based on cost
 * @param model - The model name
 * @returns boolean
 */
export function requiresApproval(model: string): boolean {
  return getBudgetTier(model) === 'critical';
}

export default {
  calculateCost,
  formatCost,
  getBudgetTier,
  requiresApproval,
  MODEL_PRICING
};
