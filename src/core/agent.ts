import { v4 as uuidv4 } from 'uuid';
import type { AgentConfig, AgentState, AgentTrace, TraceStep, MemoryEntry } from './types.js';
import { Planner } from './planner.js';
import { Executor } from './executor.js';

/**
 * Core agent orchestrator. Manages the agent lifecycle:
 * Plan → Execute → Observe → Reflect → Repeat
 *
 * Key insight: reliability comes from structure, not capability.
 * Every step is bounded, logged, and reversible.
 */
export class Agent {
  private config: AgentConfig;
  private state: AgentState;
  private planner: Planner;
  private executor: Executor;
  private trace: AgentTrace;

  constructor(config: AgentConfig) {
    this.config = config;
    this.planner = new Planner();
    this.executor = new Executor();
    this.state = {
      goal: '',
      plan: { goal: '', steps: [], currentStepIndex: 0 },
      workingMemory: [],
      stepCount: 0,
      tokensUsed: 0,
      costUsd: 0,
      status: 'idle',
    };
    this.trace = {
      runId: uuidv4(),
      steps: [],
      totalTokens: 0,
      totalCostUsd: 0,
      totalDurationMs: 0,
      finalStatus: 'idle',
    };
  }

  /**
   * Run the agent toward a goal. Returns the execution trace.
   */
  async run(goal: string): Promise<AgentTrace> {
    this.state.goal = goal;
    this.state.status = 'planning';

    // Step 1: Decompose goal into plan
    this.state.plan = this.planner.decompose(goal);
    this.addMemory('system', `Plan created with ${this.state.plan.steps.length} steps`);

    // Step 2: Execute plan steps
    while (this.state.plan.currentStepIndex < this.state.plan.steps.length) {
      // Budget check
      if (this.state.tokensUsed >= this.config.maxTokens) {
        this.state.status = 'budget_exceeded';
        break;
      }
      if (this.state.stepCount >= this.config.maxSteps) {
        this.state.status = 'budget_exceeded';
        break;
      }

      this.state.status = 'executing';
      const step = this.state.plan.steps[this.state.plan.currentStepIndex]!;
      const startTime = Date.now();

      // Execute current step
      step.status = 'in_progress';
      const result = await this.executor.execute(step);
      const duration = Date.now() - startTime;

      // Record trace
      this.trace.steps.push({
        stepIndex: this.state.stepCount,
        type: 'act',
        input: step.description,
        output: JSON.stringify(result.output),
        toolName: step.toolName,
        tokensUsed: result.tokensUsed,
        durationMs: duration,
        timestamp: Date.now(),
      });

      // Update state
      step.status = result.success ? 'complete' : 'failed';
      step.result = result.output;
      this.state.tokensUsed += result.tokensUsed;
      this.state.stepCount++;
      this.state.plan.currentStepIndex++;

      this.addMemory('tool', `Step "${step.description}": ${result.success ? 'success' : 'failed'}`);

      // Reflection checkpoint
      if (this.state.stepCount % this.config.reflectionInterval === 0) {
        this.state.status = 'reflecting';
        this.reflect();
      }

      // Circuit breaker: 3 consecutive failures
      if (this.consecutiveFailures() >= 3) {
        this.state.status = 'failed';
        this.addMemory('system', 'Circuit breaker: 3 consecutive failures, stopping agent');
        break;
      }
    }

    if (this.state.status === 'executing') {
      this.state.status = 'complete';
    }

    this.trace.finalStatus = this.state.status;
    this.trace.totalTokens = this.state.tokensUsed;
    this.trace.totalDurationMs = this.trace.steps.reduce((sum, s) => sum + s.durationMs, 0);

    return this.trace;
  }

  private reflect(): void {
    const completed = this.state.plan.steps.filter(s => s.status === 'complete').length;
    const total = this.state.plan.steps.length;
    this.addMemory('system', `Reflection: ${completed}/${total} steps complete, ${this.state.tokensUsed} tokens used`);
  }

  private consecutiveFailures(): number {
    let count = 0;
    for (let i = this.state.plan.steps.length - 1; i >= 0; i--) {
      if (this.state.plan.steps[i]!.status === 'failed') count++;
      else break;
    }
    return count;
  }

  private addMemory(role: MemoryEntry['role'], content: string): void {
    this.state.workingMemory.push({ role, content, timestamp: Date.now() });
    // Sliding window: keep last 50 entries
    if (this.state.workingMemory.length > 50) {
      this.state.workingMemory = this.state.workingMemory.slice(-50);
    }
  }

  getTrace(): AgentTrace { return this.trace; }
  getState(): AgentState { return this.state; }
}
