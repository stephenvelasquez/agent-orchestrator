# agent-orchestrator

Production-grade AI agent orchestration framework — ReAct loops, tool dispatch, goal decomposition, memory management, and guardrails. Built for teams that need agents to be reliable, not just capable.

Written in TypeScript because agents live in the application layer, type safety prevents the subtle bugs that compound across agent steps, and the JavaScript ecosystem has the broadest tool integration surface.

## What's Inside

```
agent-orchestrator/
├── src/
│   ├── index.ts                    # Framework entry point
│   ├── core/
│   │   ├── agent.ts                # Agent lifecycle and execution loop
│   │   ├── planner.ts              # Goal decomposition and plan generation
│   │   ├── executor.ts             # Step execution with retry and fallback
│   │   └── types.ts                # Core type definitions
│   ├── reasoning/
│   │   ├── react-loop.ts           # ReAct (Reason + Act) implementation
│   │   ├── reflection.ts           # Self-evaluation and course correction
│   │   └── chain-of-thought.ts     # Structured reasoning traces
│   ├── tools/
│   │   ├── registry.ts             # Tool registration and dispatch
│   │   ├── schema.ts               # Tool input/output schema validation
│   │   └── builtin/
│   │       ├── web-search.ts       # Web search tool
│   │       ├── calculator.ts       # Math evaluation tool
│   │       └── code-executor.ts    # Sandboxed code execution
│   ├── memory/
│   │   ├── working-memory.ts       # Short-term context window management
│   │   ├── episodic-memory.ts      # Long-term episode storage and retrieval
│   │   └── semantic-memory.ts      # Embedding-based knowledge retrieval
│   ├── guardrails/
│   │   ├── validator.ts            # Output validation and safety checks
│   │   ├── budget.ts               # Token and cost budget enforcement
│   │   └── circuit-breaker.ts      # Failure detection and agent termination
│   └── observability/
│       ├── tracer.ts               # Step-level execution tracing
│       └── metrics.ts              # Agent performance metrics
├── tests/
│   ├── react-loop.test.ts
│   ├── tool-registry.test.ts
│   └── guardrails.test.ts
├── examples/
│   └── research-agent.ts           # Example: multi-step research agent
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Core Architecture

### Agent Loop (ReAct)
The agent follows a **Reason → Act → Observe** loop:
1. **Reason** — given the goal and current context, decide what to do next
2. **Act** — execute a tool call or generate a response
3. **Observe** — evaluate the result and update working memory
4. **Reflect** — periodically assess progress and adjust the plan

Each loop iteration is a discrete, logged, and reversible step.

### Goal Decomposition
Complex goals are broken into sub-tasks:
- **Hierarchical planning** — top-level goal decomposes into ordered sub-goals
- **Dependency tracking** — sub-tasks declare what they need and what they produce
- **Dynamic re-planning** — plan adjusts when a step fails or new information arrives
- **Parallel execution** — independent sub-tasks execute concurrently

### Tool System
- **Schema-validated** — every tool declares its inputs and outputs with Zod schemas
- **Sandboxed** — tool execution is isolated; failures don't crash the agent
- **Retryable** — configurable retry policies per tool (exponential backoff, fallback)
- **Composable** — tools can call other tools through the registry

### Memory Architecture
- **Working memory** — sliding window of recent context (conversation + tool results)
- **Episodic memory** — past agent runs stored for few-shot learning
- **Semantic memory** — embedding-based retrieval of relevant knowledge chunks

### Guardrails
- **Token budget** — hard cap on total tokens consumed per agent run
- **Cost budget** — dollar-denominated limit on LLM API spend
- **Circuit breaker** — automatic termination after N consecutive failures
- **Output validation** — every agent response checked against safety rules
- **Hallucination detection** — flag claims that contradict tool observations

## Quick Start

```bash
npm install
npm run build
npm test

# Run the example research agent
npm run example:research -- --goal "Compare the top 3 vector databases for production RAG"
```

## Design Principles

1. **Reliability over capability** — a 95% success rate per step drops to 60% over 10 steps
2. **Observable by default** — every reasoning step is traced and exportable
3. **Fail fast, fail loud** — agents should stop and ask rather than hallucinate
4. **Type everything** — if the agent's output isn't typed, it's a bug waiting to happen
5. **Budget-aware** — unbounded agent loops are production incidents

## The Compounding Error Problem

The central challenge of autonomous agents is **compounding errors**. Each decision point has a probability of failure, and these probabilities multiply:

| Steps | 95% accuracy | 90% accuracy |
|-------|-------------|-------------|
| 5     | 77%         | 59%         |
| 10    | 60%         | 35%         |
| 20    | 36%         | 12%         |

This framework addresses compounding errors through:
- **Reflection checkpoints** — periodic self-evaluation catches drift early
- **Plan adjustment** — re-plan when observations diverge from expectations
- **Guardrails** — hard stops before the agent goes off the rails
- **Human-in-the-loop** — configurable escalation points for uncertain decisions

## Background

Built from experience shipping AI-powered products and understanding that the hard part of agents isn't the LLM — it's the orchestration, error handling, and observability that make them production-ready. Every guardrail in this framework exists because its absence caused a real failure.

## License

MIT
