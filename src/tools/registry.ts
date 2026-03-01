import { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  handler: (input: unknown) => Promise<unknown>;
  retryPolicy?: { maxRetries: number; backoffMs: number };
}

/**
 * Tool registry with schema validation and dispatch.
 * Every tool declares its contract — inputs and outputs are validated.
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  async dispatch(name: string, input: unknown): Promise<{ success: boolean; output: unknown; error?: string }> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, output: null, error: `Tool "${name}" not found` };
    }

    // Validate input
    const inputResult = tool.inputSchema.safeParse(input);
    if (!inputResult.success) {
      return { success: false, output: null, error: `Invalid input: ${inputResult.error.message}` };
    }

    try {
      const output = await tool.handler(inputResult.data);

      // Validate output
      const outputResult = tool.outputSchema.safeParse(output);
      if (!outputResult.success) {
        return { success: false, output, error: `Invalid output: ${outputResult.error.message}` };
      }

      return { success: true, output: outputResult.data };
    } catch (error) {
      return { success: false, output: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  list(): { name: string; description: string }[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
    }));
  }

  has(name: string): boolean { return this.tools.has(name); }
}
