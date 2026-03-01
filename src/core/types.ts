export interface AgentConfig {
  name: string;
  model: string;
  maxSteps: number;
  maxTokens: number;
  maxCostUsd: number;
  reflectionInterval: number; // reflect every N steps
  tools: string[];
  systemPrompt: string;
}

export interface AgentState {
  goal: string;
  plan: Plan;
  workingMemory: MemoryEntry[];
  stepCount: number;
  tokensUsed: number;
  costUsd: number;
  status: AgentStatus;
}

export type AgentStatus = 'idle' | 'planning' | 'executing' | 'reflecting' | 'complete' | 'failed' | 'budget_exceeded';

export interface Plan {
  goal: string;
  steps: PlanStep[];
  currentStepIndex: number;
}

export interface PlanStep {
  id: string;
  description: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  status: 'pending' | 'in_progress' | 'complete' | 'failed' | 'skipped';
  result?: unknown;
  dependsOn: string[];
}

export interface MemoryEntry {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  output: unknown;
  error?: string;
  tokensUsed: number;
  durationMs: number;
}

export interface AgentTrace {
  runId: string;
  steps: TraceStep[];
  totalTokens: number;
  totalCostUsd: number;
  totalDurationMs: number;
  finalStatus: AgentStatus;
}

export interface TraceStep {
  stepIndex: number;
  type: 'reason' | 'act' | 'observe' | 'reflect';
  input: string;
  output: string;
  toolName?: string;
  tokensUsed: number;
  durationMs: number;
  timestamp: number;
}
