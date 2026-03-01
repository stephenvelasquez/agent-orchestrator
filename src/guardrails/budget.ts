/**
 * Token and cost budget enforcement.
 * Prevents unbounded agent execution — the #1 production risk.
 */
export interface BudgetConfig {
  maxTokens: number;
  maxCostUsd: number;
  maxSteps: number;
  maxDurationMs: number;
}

export interface BudgetState {
  tokensUsed: number;
  costUsd: number;
  stepsExecuted: number;
  startTime: number;
}

export interface BudgetCheck {
  allowed: boolean;
  reason?: string;
  tokensRemaining: number;
  costRemaining: number;
  stepsRemaining: number;
}

export function checkBudget(config: BudgetConfig, state: BudgetState): BudgetCheck {
  const tokensRemaining = config.maxTokens - state.tokensUsed;
  const costRemaining = config.maxCostUsd - state.costUsd;
  const stepsRemaining = config.maxSteps - state.stepsExecuted;
  const elapsed = Date.now() - state.startTime;

  if (tokensRemaining <= 0) {
    return { allowed: false, reason: 'Token budget exhausted', tokensRemaining: 0, costRemaining, stepsRemaining };
  }
  if (costRemaining <= 0) {
    return { allowed: false, reason: 'Cost budget exhausted', tokensRemaining, costRemaining: 0, stepsRemaining };
  }
  if (stepsRemaining <= 0) {
    return { allowed: false, reason: 'Step limit reached', tokensRemaining, costRemaining, stepsRemaining: 0 };
  }
  if (elapsed > config.maxDurationMs) {
    return { allowed: false, reason: 'Duration limit exceeded', tokensRemaining, costRemaining, stepsRemaining };
  }

  return { allowed: true, tokensRemaining, costRemaining, stepsRemaining };
}
