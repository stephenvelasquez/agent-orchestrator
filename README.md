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

## Architecture

```mermaid
flowchart TB
    subgraph Input["Goal Input"]
        GOAL[User Goal]
    end

    subgraph Planning["Plan Layer"]
        GOAL --> DECOMPOSE[Goal Decomposition]
        DECOMPOSE --> PLAN[Execution Plan]
        PLAN --> REPLAN[Dynamic Re-planner]
    end

    subgraph Loop["ReAct Loop"]
        REASON[Reason] --> ACT[Act]
        ACT --> OBSERVE[Observe]
        OBSERVE --> REFLECT[Reflect]
        REFLECT -->|Continue| REASON
        REFLECT -->|Replan needed| REPLAN
        REPLAN --> REASON
    end

    subgraph Tools["Tool Layer"]
        ACT --> REGISTRY[Tool Registry]
        REGISTRY --> VALIDATE[Schema Validation]
        VALIDATE --> SANDBOX[Sandboxed Execution]
        SANDBOX --> RETRY[Retry / Fallback]
    end

    subgraph Memory["Memory Layer"]
        OBSERVE --> WORKING[Working Memory]
        OBSERVE --> EPISODIC[Episodic Memory]
        REASON --> SEMANTIC[Semantic Memory]
        WORKING --> REASON
    end

    subgraph Safety["Guardrails"]
        BUDGET[Token / Cost Budget]
        CIRCUIT[Circuit Breaker]
        VALIDATOR[Output Validation]
        HALLUC[Hallucination Check]
    end

    PLAN --> REASON
    Safety -.->|Enforced at every step| Loop

    style REASON fill:#3498db,color:#fff
    style ACT fill:#2ecc71,color:#fff
    style OBSERVE fill:#f39c12,color:#fff
    style REFLECT fill:#9b59b6,color:#fff
    style CIRCUIT fill:#e74c3c,color:#fff
```

### Agent Loop (ReAct)

The agent follows a **Reason > Act > Observe > Reflect** loop:

1. **Reason** - given the goal and current context, decide what to do next
2. **Act** - execute a tool call or generate a response
3. **Observe** - evaluate the result and update working memory
4. **Reflect** - periodically assess progress and adjust the plan

Each loop iteration is a discrete, logged, and reversible step.

### Goal Decomposition

Complex goals are broken into sub-tasks:

- **Hierarchical planning** - top-level goal decomposes into ordered sub-goals
- **Dependency tracking** - sub-tasks declare what they need and what they produce
- **Dynamic re-planning** - plan adjusts when a step fails or new information arrives
- **Parallel execution** - independent sub-tasks execute concurrently

### Tool System

- **Schema-validated** - every tool declares its inputs and outputs with Zod schemas
- **Sandboxed** - tool execution is isolated; failures don't crash the agent
- **Retryable** - configurable retry policies per tool (exponential backoff, fallback)
- **Composable** - tools can call other tools through the registry

### Memory Architecture

```mermaid
flowchart LR
    subgraph Short["Short-Term"]
        WM[Working Memory<br/>Sliding context window]
    end

    subgraph Long["Long-Term"]
        EM[Episodic Memory<br/>Past agent runs]
        SM[Semantic Memory<br/>Embedding retrieval]
    end

    subgraph Agent["Agent Loop"]
        R[Reason Step]
    end

    WM --> R
    EM -->|Few-shot examples| R
    SM -->|Relevant knowledge| R
    R -->|New observations| WM
    R -->|Completed episodes| EM
```

- **Working memory** - sliding window of recent context (conversation + tool results)
- **Episodic memory** - past agent runs stored for few-shot learning
- **Semantic memory** - embedding-based retrieval of relevant knowledge chunks

### Guardrails

- **Token budget** - hard cap on total tokens consumed per agent run
- **Cost budget** - dollar-denominated limit on LLM API spend
- **Circuit breaker** - automatic termination after N consecutive failures
- **Output validation** - every agent response checked against safety rules
- **Hallucination detection** - flag claims that contradict tool observations

## Architecture Decisions & Trade-offs

| Decision | Choice | Alternative Considered | Rationale |
|----------|--------|----------------------|-----------|
| Language | TypeScript | Python, Go | Agents are application-layer code. Type safety catches the subtle interface mismatches that compound across multi-step execution. Python's dynamic typing is a liability when agent outputs feed into tool inputs across dozens of steps. |
| Agent pattern | ReAct | Plan-and-Execute, Tree of Thought | ReAct balances reasoning quality with implementation simplicity. Plan-and-Execute front-loads planning but can't adapt mid-execution. Tree of Thought adds latency that's rarely justified outside research benchmarks. |
| Tool validation | Zod schemas | JSON Schema, runtime checks | Zod gives compile-time type inference plus runtime validation in one declaration. JSON Schema requires separate type generation. Runtime-only checks miss errors until production. |
| Memory model | Three-tier (working + episodic + semantic) | Single context window | Single context windows hit token limits fast. Three-tier memory lets agents reference relevant history without carrying everything in context. The cost is retrieval latency (~50ms) which is negligible against LLM inference time. |
| Error strategy | Circuit breaker + retry | Unlimited retry, fail-fast | Unlimited retry burns budget on unrecoverable failures. Fail-fast loses recoverable work. Circuit breaker gives N attempts before stopping - enough for transient failures, bounded for permanent ones. |
| Observability | Built-in tracing | External APM only | Agent debugging requires step-level traces that standard APM tools don't capture. Every reasoning step, tool call, and memory retrieval is logged as a structured span. External APM integration is additive, not a replacement. |

## Production Deployment

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        API[API Gateway]
    end

    subgraph Agents["Agent Workers"]
        W1[Worker 1]
        W2[Worker 2]
        W3[Worker N]
    end

    subgraph Infra["Infrastructure"]
        QUEUE[Task Queue]
        STORE[Episode Store]
        VECTORS[Vector DB]
        LLM[LLM Provider]
        TRACE[Trace Collector]
    end

    API --> QUEUE
    QUEUE --> W1
    QUEUE --> W2
    QUEUE --> W3
    W1 & W2 & W3 --> LLM
    W1 & W2 & W3 --> VECTORS
    W1 & W2 & W3 --> STORE
    W1 & W2 & W3 --> TRACE
```

**Scaling model**: Agent workers are stateless consumers pulling from a task queue. Each worker manages its own ReAct loop, memory retrieval, and tool execution. Horizontal scaling is adding workers.

**Cost control**: Every agent run has a hard token and dollar budget. Circuit breakers terminate runaway agents. In production, the median agent run costs $0.02-0.08 depending on task complexity. Budget enforcement prevents the $50 agent run that does nothing useful.

**Failure modes addressed**:
- **LLM provider outage**: Retry with exponential backoff, fallback to secondary provider
- **Tool timeout**: Per-tool timeout with graceful degradation (agent continues without that tool's output)
- **Infinite loop**: Step counter + reflection checkpoints detect circular reasoning
- **Budget exhaustion**: Hard stop with partial result return and human escalation

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
