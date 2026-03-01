import { z } from 'zod';
import type { ToolDefinition } from '../registry.js';

export const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: 'Evaluate a mathematical expression safely',
  inputSchema: z.object({
    expression: z.string().describe('Math expression to evaluate (e.g., "2 + 3 * 4")'),
  }),
  outputSchema: z.object({
    result: z.number(),
    expression: z.string(),
  }),
  handler: async (input: unknown) => {
    const { expression } = input as { expression: string };

    // Safe evaluation: only allow numbers and basic operators
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (sanitized !== expression) {
      throw new Error('Expression contains disallowed characters');
    }

    // Use Function constructor for safe math evaluation
    const result = Function(`"use strict"; return (${sanitized})`)() as number;

    if (!Number.isFinite(result)) {
      throw new Error('Expression resulted in non-finite number');
    }

    return { result, expression: sanitized };
  },
};
