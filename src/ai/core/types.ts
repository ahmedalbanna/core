/**
 * Core types for dynamic schema system
 */

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url';

export interface ValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  format?: 'email' | 'url' | 'date' | 'uuid';
  custom?: {
    message: string;
    validator: string; // Function as string for serialization
  };
}

export interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule;
  placeholder?: string;
  label?: string;
  group?: string;
  order?: number;
}

export interface SchemaDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  input: {
    fields: SchemaField[];
  };
  output: {
    fields: SchemaField[];
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    author: string;
    tags: string[];
  };
}

export interface FlowConfig {
  name: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPrompt?: string;
  streaming?: boolean;
}

export interface DynamicFlow {
  id: string;
  schema: SchemaDefinition;
  config: FlowConfig;
  implementation: string; // Function as string for serialization
}

export interface SchemaValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
  data?: any;
}