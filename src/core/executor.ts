import type { PlanStep, ToolResult } from './types.js';

/**
 * Step executor with retry and fallback logic.
 * Each step is isolated — a failure doesn't cascade.
 */
export class Executor {
  private maxRetries = 2;
  private retryDelayMs = 1000;

  async execute(step: PlanStep): Promise<ToolResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        // Simulate tool execution
        // In production: dispatch to tool registry
        const output = await this.simulateExecution(step);

        return {
          success: true,
          output,
          tokensUsed: 150, // simulated
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * Math.pow(2, attempt));
        }
      }
    }

    return {
      success: false,
      output: null,
      error: lastError,
      tokensUsed: 50,
      durationMs: 0,
    };
  }

  private async simulateExecution(step: PlanStep): Promise<unknown> {
    // Simulate different tool types
    if (step.toolName === 'web_search') {
      return { results: [`Result for: ${step.toolInput?.query}`], count: 5 };
    }
    if (step.toolName === 'calculator') {
      return { result: 42 };
    }
    return { completed: true, description: step.description };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
