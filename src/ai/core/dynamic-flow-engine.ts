/**
 * Dynamic Flow Engine
 * Core engine for creating and managing dynamic AI flows
 */

import { ai } from '../../ai/genkit';
import { SchemaConverter } from './schema-converter';
import {
  DynamicFlow,
  FlowConfig,
  SchemaDefinition
} from './types';


export class DynamicFlowEngine {
  private static flows = new Map<string, DynamicFlow>();
  private static cache = new Map<string, any>();

  /**
   * Create a dynamic AI flow from schema definition
   */
  static createFlow(
    schema: SchemaDefinition,
    config: FlowConfig,
    implementation?: string
  ): DynamicFlow {
    const { inputSchema, outputSchema } = SchemaConverter.convertToZod(schema);

    // Default implementation if none provided
    const defaultImplementation = this.generateDefaultImplementation(schema, config);
    const flowImplementation = implementation || defaultImplementation;

    // Create the actual AI flow
    const flow = ai.defineFlow(
      {
        name: config.name,
        inputSchema,
        outputSchema,
      },
      async (input) => {
        try {
          // Execute the custom implementation
          const impl = new Function('input', 'ai', 'config', 'schema', flowImplementation);
          return await impl(input, ai, config, schema);
        } catch (error) {
          console.error(`Flow execution error in ${config.name}:`, error);
          throw new Error(`Flow execution failed: ${error.message}`);
        }
      }
    );

    const dynamicFlow: DynamicFlow = {
      id: schema.id,
      schema,
      config,
      implementation: flowImplementation
    };

    // Cache the flow
    this.flows.set(schema.id, dynamicFlow);
    this.cache.set(`flow_${schema.id}`, flow);

    return dynamicFlow;
  }

  /**
   * Get a cached flow
   */
  static getFlow(schemaId: string) {
    return this.cache.get(`flow_${schemaId}`);
  }

  /**
   * Get dynamic flow definition
   */
  static getDynamicFlow(schemaId: string): DynamicFlow | undefined {
    return this.flows.get(schemaId);
  }

  /**
   * Execute a dynamic flow
   */
  static async executeFlow(
    schemaId: string,
    input: any,
    options?: {
      validateInput?: boolean;
      validateOutput?: boolean;
    }
  ): Promise<{
    success: boolean;
    result?: any;
    errors?: string[];
    validationErrors?: any[];
  }> {
    const dynamicFlow = this.getDynamicFlow(schemaId);
    const flow = this.getFlow(schemaId);

    if (!dynamicFlow || !flow) {
      return {
        success: false,
        errors: ['Flow not found']
      };
    }

    try {
      // Input validation
      if (options?.validateInput !== false) {
        const validation = SchemaConverter.validateData(
          input,
          dynamicFlow.schema.input.fields,
          true
        );

        if (!validation.valid) {
          return {
            success: false,
            validationErrors: validation.errors
          };
        }
      }

      // Execute flow
      const result = await flow(input);

      // Output validation
      if (options?.validateOutput !== false) {
        const validation = SchemaConverter.validateData(
          result,
          dynamicFlow.schema.output.fields,
          false
        );

        if (!validation.valid) {
          console.warn('Output validation failed:', validation.errors);
          // Don't fail execution for output validation, just warn
        }
      }

      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message || 'Unknown execution error']
      };
    }
  }

  /**
   * Update an existing flow
   */
  static updateFlow(
    schemaId: string,
    updates: {
      schema?: Partial<SchemaDefinition>;
      config?: Partial<FlowConfig>;
      implementation?: string;
    }
  ): boolean {
    const existingFlow = this.flows.get(schemaId);
    if (!existingFlow) return false;

    // Update schema
    if (updates.schema) {
      existingFlow.schema = { ...existingFlow.schema, ...updates.schema };
    }

    // Update config
    if (updates.config) {
      existingFlow.config = { ...existingFlow.config, ...updates.config };
    }

    // Update implementation
    if (updates.implementation) {
      existingFlow.implementation = updates.implementation;
    }

    // Recreate the flow with updates
    this.createFlow(existingFlow.schema, existingFlow.config, existingFlow.implementation);

    return true;
  }

  /**
   * Delete a flow
   */
  static deleteFlow(schemaId: string): boolean {
    const deleted = this.flows.delete(schemaId);
    this.cache.delete(`flow_${schemaId}`);
    return deleted;
  }

  /**
   * List all flows
   */
  static listFlows(): DynamicFlow[] {
    return Array.from(this.flows.values());
  }

  /**
   * Generate default implementation for a schema
   */
  private static generateDefaultImplementation(
    schema: SchemaDefinition,
    config: FlowConfig
  ): string {
    // Analyze input fields to determine prompt fields
    const systemPromptField = schema.input.fields.find(
      f => f.name.toLowerCase().includes('system') || f.name.toLowerCase().includes('persona')
    );
    const userPromptField = schema.input.fields.find(
      f => f.name.toLowerCase().includes('prompt') ||
        f.name.toLowerCase().includes('message') ||
        f.name.toLowerCase().includes('query') ||
        f.name.toLowerCase().includes('request')
    );

    // Determine output format
    const outputFields = schema.output.fields;
    const singleStringOutput = outputFields.length === 1 && outputFields[0].type === 'string';

    return `
// Auto-generated implementation for ${schema.name}
const systemPrompt = input.${systemPromptField?.name || 'systemPrompt'} ||
  config.systemPrompt ||
  'You are a helpful AI assistant. Respond according to the user\\'s request.';

const userPrompt = input.${userPromptField?.name || 'userPrompt'} ||
  input.message ||
  input.query ||
  'Please help me with my request.';

// Generate AI response
const response = await ai.generate({
  model: config.model || 'googleai/gemini-2.5-flash-lite',
  prompt: userPrompt,
  system: systemPrompt,
  config: {
    temperature: config.temperature || 0.7,
    ${config.maxTokens ? `maxTokens: ${config.maxTokens},` : ''}
  },
});

${singleStringOutput ?
        `// Return simple string response
return response.text;` :
        `// Return structured response
const result = {};
${outputFields.map(field => {
          if (field.type === 'string') {
            return `result.${field.name} = response.text;`;
          } else {
            return `result.${field.name} = response.text; // Auto-converted to ${field.type}`;
          }
        }).join('\n')}

return result;`}`;
  }

  /**
   * Validate schema definition
   */
  static validateSchema(schema: SchemaDefinition): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!schema.id) errors.push('Schema ID is required');
    if (!schema.name) errors.push('Schema name is required');
    if (!schema.version) errors.push('Schema version is required');

    // Input validation
    if (!schema.input.fields || schema.input.fields.length === 0) {
      errors.push('At least one input field is required');
    } else {
      schema.input.fields.forEach((field, index) => {
        if (!field.name) errors.push(`Input field ${index + 1}: name is required`);
        if (!field.type) errors.push(`Input field ${index + 1}: type is required`);
        if (field.name && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field.name)) {
          errors.push(`Input field ${index + 1}: invalid field name "${field.name}"`);
        }
      });
    }

    // Output validation
    if (!schema.output.fields || schema.output.fields.length === 0) {
      errors.push('At least one output field is required');
    } else {
      schema.output.fields.forEach((field, index) => {
        if (!field.name) errors.push(`Output field ${index + 1}: name is required`);
        if (!field.type) errors.push(`Output field ${index + 1}: type is required`);
        if (field.name && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field.name)) {
          errors.push(`Output field ${index + 1}: invalid field name "${field.name}"`);
        }
      });
    }

    // Check for duplicate field names
    const inputNames = schema.input.fields.map(f => f.name).filter(Boolean);
    const duplicateInputs = inputNames.filter((name, index) => inputNames.indexOf(name) !== index);
    if (duplicateInputs.length > 0) {
      errors.push(`Duplicate input field names: ${duplicateInputs.join(', ')}`);
    }

    const outputNames = schema.output.fields.map(f => f.name).filter(Boolean);
    const duplicateOutputs = outputNames.filter((name, index) => outputNames.indexOf(name) !== index);
    if (duplicateOutputs.length > 0) {
      errors.push(`Duplicate output field names: ${duplicateOutputs.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export schema as JSON
   */
  static exportSchema(schemaId: string): string | null {
    const flow = this.getDynamicFlow(schemaId);
    return flow ? JSON.stringify(flow.schema, null, 2) : null;
  }

  /**
   * Import schema from JSON
   */
  static importSchema(jsonSchema: string): {
    success: boolean;
    schema?: SchemaDefinition;
    errors?: string[];
  } {
    try {
      const schema: SchemaDefinition = JSON.parse(jsonSchema);
      const validation = this.validateSchema(schema);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      return {
        success: true,
        schema
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Invalid JSON format']
      };
    }
  }

  /**
   * Get flow statistics
   */
  static getStats() {
    const flows = this.listFlows();
    return {
      totalFlows: flows.length,
      flowsByModel: flows.reduce((acc, flow) => {
        acc[flow.config.model] = (acc[flow.config.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageInputFields: flows.reduce((sum, flow) => sum + flow.schema.input.fields.length, 0) / flows.length || 0,
      averageOutputFields: flows.reduce((sum, flow) => sum + flow.schema.output.fields.length, 0) / flows.length || 0
    };
  }

  /**
   * Clear all flows and cache
   */
  static clear() {
    this.flows.clear();
    this.cache.clear();
  }
}
