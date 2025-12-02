/**
 * Utility functions for dynamic schema system
 */

import { SchemaDefinition, SchemaField, FieldType } from './types';

/**
 * Create a new empty schema definition
 */
export function createEmptySchema(name: string = 'New Schema'): SchemaDefinition {
  return {
    id: `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: '',
    version: '1.0.0',
    input: { fields: [] },
    output: { fields: [] },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'user',
      tags: []
    }
  };
}

/**
 * Create a new empty field
 */
export function createEmptyField(type: FieldType = 'string'): SchemaField {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    type,
    description: '',
    required: true,
    order: 0
  };
}

/**
 * Clone a schema with a new ID
 */
export function cloneSchema(schema: SchemaDefinition, newName?: string): SchemaDefinition {
  const cloned = JSON.parse(JSON.stringify(schema));
  cloned.id = `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  cloned.name = newName || `${schema.name} (Copy)`;
  cloned.metadata.createdAt = new Date().toISOString();
  cloned.metadata.updatedAt = new Date().toISOString();
  
  // Generate new IDs for all fields
  cloned.input.fields = cloned.input.fields.map((field: SchemaField) => ({
    ...field,
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }));
  
  cloned.output.fields = cloned.output.fields.map((field: SchemaField) => ({
    ...field,
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }));
  
  return cloned;
}

/**
 * Clone a field with a new ID
 */
export function cloneField(field: SchemaField, newName?: string): SchemaField {
  return {
    ...field,
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: newName || `${field.name}_copy`
  };
}

/**
 * Validate field name (must be valid JavaScript identifier)
 */
export function isValidFieldName(name: string): boolean {
  if (!name) return false;
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Generate sample data for a field based on its type
 */
export function generateSampleData(field: SchemaField): any {
  switch (field.type) {
    case 'string':
      if (field.validation?.enum && field.validation.enum.length > 0) {
        return field.validation.enum[0];
      }
      return field.placeholder || field.description || 'Sample text';
    
    case 'email':
      return 'user@example.com';
    
    case 'url':
      return 'https://example.com';
    
    case 'number':
      if (field.validation?.min !== undefined) {
        return field.validation.min;
      }
      if (field.validation?.max !== undefined) {
        return Math.min(field.validation.max, 100);
      }
      return 42;
    
    case 'boolean':
      return true;
    
    case 'date':
      return new Date().toISOString().split('T')[0];
    
    case 'array':
      return ['item1', 'item2'];
    
    case 'object':
      return { key: 'value' };
    
    default:
      return null;
  }
}

/**
 * Generate sample input data for an entire schema
 */
export function generateSampleInputData(schema: SchemaDefinition): Record<string, any> {
  const data: Record<string, any> = {};
  
  schema.input.fields.forEach(field => {
    if (field.name && isValidFieldName(field.name)) {
      data[field.name] = field.defaultValue !== undefined 
        ? field.defaultValue 
        : generateSampleData(field);
    }
  });
  
  return data;
}

/**
 * Get field type display name
 */
export function getFieldTypeDisplayName(type: FieldType): string {
  const typeMap: Record<FieldType, string> = {
    string: 'Text',
    number: 'Number',
    boolean: 'Boolean',
    email: 'Email',
    url: 'URL',
    date: 'Date',
    array: 'Array',
    object: 'Object'
  };
  
  return typeMap[type] || type;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Deep merge two objects
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }
  
  return result;
}

/**
 * Convert camelCase to human readable format
 */
export function camelCaseToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim();
}

/**
 * Convert human readable text to camelCase
 */
export function titleToCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, char => char.toLowerCase());
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Generate a random ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sort fields by order, then by name
 */
export function sortFields(fields: SchemaField[]): SchemaField[] {
  return [...fields].sort((a, b) => {
    // Sort by order first
    if (a.order !== undefined && b.order !== undefined) {
      if (a.order !== b.order) return a.order - b.order;
    }
    if (a.order !== undefined && b.order === undefined) return -1;
    if (a.order === undefined && b.order !== undefined) return 1;
    
    // Then by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Reorder array items
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Get validation error message for a field type
 */
export function getValidationErrorMessage(
  fieldName: string,
  fieldType: FieldType,
  errorType: string,
  value?: any
): string {
  const displayName = camelCaseToTitle(fieldName);
  
  switch (errorType) {
    case 'required':
      return `${displayName} is required`;
    case 'type':
      return `${displayName} must be a valid ${getFieldTypeDisplayName(fieldType).toLowerCase()}`;
    case 'min':
      return fieldType === 'string' 
        ? `${displayName} must be at least ${value} characters long`
        : `${displayName} must be at least ${value}`;
    case 'max':
      return fieldType === 'string'
        ? `${displayName} must be at most ${value} characters long`
        : `${displayName} must be at most ${value}`;
    case 'pattern':
      return `${displayName} format is invalid`;
    case 'enum':
      return `${displayName} must be one of the allowed values`;
    default:
      return `${displayName} is invalid`;
  }
}