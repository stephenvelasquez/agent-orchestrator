import type { AgentState } from '../core/types.js';

/**
 * Self-evaluation and course correction.
 * Periodically assesses agent progress and adjusts the plan.
 *
 * Key insight: without reflection, agents drift.
 * A 5% error rate per step becomes 40% after 10 steps.
 */
export interface ReflectionResult {
  assessment: string;
  confidence: number;    // 0-1
  shouldReplan: boolean;
  shouldStop: boolean;
  reason: string;
}

export function reflect(state: AgentState): ReflectionResult {
  const completedSteps = state.plan.steps.filter(s => s.status === 'complete');
  const failedSteps = state.plan.steps.filter(s => s.status === 'failed');
  const totalSteps = state.plan.steps.length;

  const successRate = totalSteps > 0
    ? completedSteps.length / (completedSteps.length + failedSteps.length || 1)
    : 1;

  // High failure rate → replan
  if (successRate < 0.5 && failedSteps.length >= 2) {
    return {
      assessment: `Low success rate (${(successRate * 100).toFixed(0)}%). Multiple steps failing.`,
      confidence: 0.3,
      shouldReplan: true,
      shouldStop: false,
      reason: 'High failure rate suggests current approach is wrong',
    };
  }

  // Budget running low → compress remaining plan
  const budgetUsedPct = state.tokensUsed / 10000; // assume 10k max
  const progressPct = state.plan.currentStepIndex / totalSteps;
  if (budgetUsedPct > 0.8 && progressPct < 0.5) {
    return {
      assessment: 'Budget running low with insufficient progress.',
      confidence: 0.5,
      shouldReplan: true,
      shouldStop: false,
      reason: 'Need to compress remaining plan to fit budget',
    };
  }

  // Everything on track
  return {
    assessment: `Progress: ${completedSteps.length}/${totalSteps} steps complete. On track.`,
    confidence: Math.min(successRate, 0.95),
    shouldReplan: false,
    shouldStop: false,
    reason: 'Proceeding as planned',
  };
}
