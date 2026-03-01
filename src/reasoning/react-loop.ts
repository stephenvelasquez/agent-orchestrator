import type { MemoryEntry, TraceStep } from '../core/types.js';

/**
 * ReAct (Reason + Act) implementation.
 *
 * Each iteration:
 * 1. Thought — reason about the current state and what to do next
 * 2. Action — select and parameterize a tool call
 * 3. Observation — process the tool result
 *
 * The loop terminates when:
 * - The agent produces a final answer
 * - The step budget is exhausted
 * - The circuit breaker trips
 */
export interface ReActStep {
  thought: string;
  action: { tool: string; input: Record<string, unknown> } | null;
  observation: string | null;
  isFinal: boolean;
}

export class ReActLoop {
  private steps: ReActStep[] = [];
  private maxIterations: number;

  constructor(maxIterations: number = 10) {
    this.maxIterations = maxIterations;
  }

  /**
   * Execute a single ReAct iteration.
   */
  step(context: MemoryEntry[], availableTools: string[]): ReActStep {
    // In production: LLM generates thought + action
    // Here: demonstrate the contract

    const iteration = this.steps.length;

    if (iteration >= this.maxIterations) {
      return {
        thought: 'Maximum iterations reached. Producing best answer from available information.',
        action: null,
        observation: null,
        isFinal: true,
      };
    }

    const step: ReActStep = {
      thought: `Iteration ${iteration + 1}: Analyzing context (${context.length} entries)`,
      action: iteration < this.maxIterations - 1 ? {
        tool: availableTools[0] ?? 'none',
        input: { query: 'step query' },
      } : null,
      observation: null,
      isFinal: iteration >= this.maxIterations - 1,
    };

    this.steps.push(step);
    return step;
  }

  /**
   * Record an observation from a tool execution.
   */
  observe(observation: string): void {
    const lastStep = this.steps[this.steps.length - 1];
    if (lastStep) {
      lastStep.observation = observation;
    }
  }

  getHistory(): ReActStep[] { return [...this.steps]; }
  iterationCount(): number { return this.steps.length; }
}
