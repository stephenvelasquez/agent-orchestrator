import { Agent } from '../src/core/agent.js';
import type { AgentConfig } from '../src/core/types.js';

const config: AgentConfig = {
  name: 'research-agent',
  model: 'gpt-4',
  maxSteps: 20,
  maxTokens: 10000,
  maxCostUsd: 1.00,
  reflectionInterval: 5,
  tools: ['web_search', 'calculator'],
  systemPrompt: 'You are a research agent. Gather information, analyze it, and produce a structured report.',
};

async function main() {
  const goal = process.argv.slice(2).join(' ') || 'Compare the top 3 vector databases for production RAG';

  console.log(`Research Agent`);
  console.log(`Goal: ${goal}`);
  console.log('='.repeat(60));

  const agent = new Agent(config);
  const trace = await agent.run(goal);

  console.log(`\nExecution Summary`);
  console.log('-'.repeat(40));
  console.log(`  Status:    ${trace.finalStatus}`);
  console.log(`  Steps:     ${trace.steps.length}`);
  console.log(`  Tokens:    ${trace.totalTokens}`);
  console.log(`  Duration:  ${(trace.totalDurationMs / 1000).toFixed(1)}s`);

  console.log(`\nStep Details:`);
  for (const step of trace.steps) {
    const tool = step.toolName ? ` [${step.toolName}]` : '';
    console.log(`  ${step.stepIndex + 1}. ${step.type}${tool}: ${step.input.substring(0, 60)}`);
  }
}

main().catch(console.error);
