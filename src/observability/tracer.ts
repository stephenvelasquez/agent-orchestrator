import type { AgentTrace, TraceStep } from '../core/types.js';

/**
 * Step-level execution tracing for agent observability.
 * Every reasoning step, tool call, and reflection is recorded.
 */
export class Tracer {
  private traces: Map<string, AgentTrace> = new Map();

  startTrace(runId: string): void {
    this.traces.set(runId, {
      runId,
      steps: [],
      totalTokens: 0,
      totalCostUsd: 0,
      totalDurationMs: 0,
      finalStatus: 'idle',
    });
  }

  addStep(runId: string, step: TraceStep): void {
    const trace = this.traces.get(runId);
    if (!trace) return;
    trace.steps.push(step);
    trace.totalTokens += step.tokensUsed;
    trace.totalDurationMs += step.durationMs;
  }

  getTrace(runId: string): AgentTrace | undefined {
    return this.traces.get(runId);
  }

  /**
   * Export trace as a structured JSON for analysis.
   */
  exportTrace(runId: string): string {
    const trace = this.traces.get(runId);
    if (!trace) return '{}';
    return JSON.stringify(trace, null, 2);
  }

  /**
   * Summary statistics for a trace.
   */
  summarize(runId: string): { steps: number; tokens: number; duration: string; status: string } | null {
    const trace = this.traces.get(runId);
    if (!trace) return null;
    return {
      steps: trace.steps.length,
      tokens: trace.totalTokens,
      duration: `${(trace.totalDurationMs / 1000).toFixed(1)}s`,
      status: trace.finalStatus,
    };
  }
}
