/**
 * Dynamic Schema to Zod Converter
 * Converts UI-defined schemas into native Zod schemas for AI flows
 */

import { z } from 'zod';
import { SchemaField, SchemaDefinition, ValidationRule, SchemaValidationResult } from './types';

export class SchemaConverter {
  /**
   * Convert a single field definition to Zod schema
   */
  static buildZodField(field: SchemaField): z.ZodSchema {
    let schema: z.ZodSchema;

    // Base schema based on field type
    switch (field.type) {
      case 'string':
        schema = z.string();
        break;
      case 'number':
        schema = z.number();
        break;
      case 'boolean':
        schema = z.boolean();
        break;
      case 'date':
        schema = z.date();
        break;
      case 'email':
        schema = z.string().email();
        break;
      case 'url':
        schema = z.string().url();
        break;
      case 'array':
        schema = z.array(z.any()); // Could be enhanced with array item schema
        break;
      case 'object':
        schema = z.object({});
        break;
      default:
        schema = z.any();
    }

    // Apply validation rules
    if (field.validation) {
      schema = this.applyValidationRules(schema, field.validation, field.type);
    }

    // Add description
    if (field.description) {
      schema = schema.describe(field.description);
    }

    // Handle optional fields
    if (!field.required) {
      schema = schema.optional();
    }

    // Add default value
    if (field.defaultValue !== undefined) {
      schema = schema.default(field.defaultValue);
    }

    return schema;
  }

  /**
   * Apply validation rules to schema
   */
  private static applyValidationRules(
    schema: z.ZodSchema, 
    rules: ValidationRule, 
    fieldType: string
  ): z.ZodSchema {
    if (fieldType === 'string') {
      const stringSchema = schema as z.ZodString;
      
      if (rules.min !== undefined) {
        schema = stringSchema.min(rules.min);
      }
      
      if (rules.max !== undefined) {
        schema = stringSchema.max(rules.max);
      }
      
      if (rules.pattern) {
        try {
          schema = stringSchema.regex(new RegExp(rules.pattern));
        } catch (error) {
          console.warn('Invalid regex pattern:', rules.pattern);
        }
      }
      
      if (rules.enum && rules.enum.length > 0) {
        schema = z.enum(rules.enum as [string, ...string[]]);
      }
    } else if (fieldType === 'number') {
      const numberSchema = schema as z.ZodNumber;
      
      if (rules.min !== undefined) {
        schema = numberSchema.min(rules.min);
      }
      
      if (rules.max !== undefined) {
        schema = numberSchema.max(rules.max);
      }
    }

    // Custom validation
    if (rules.custom) {
      try {
        const validator = new Function('return ' + rules.custom.validator)();
        schema = schema.refine(validator, { message: rules.custom.message });
      } catch (error) {
        console.warn('Invalid custom validator:', error);
      }
    }

    return schema;
  }

  /**
   * Convert complete schema definition to Zod schemas
   */
  static convertToZod(schemaDefinition: SchemaDefinition) {
    // Build input schema
    const inputShape: Record<string, z.ZodSchema> = {};
    const validInputFields = schemaDefinition.input.fields.filter(field => field.name.trim());
    
    for (const field of validInputFields) {
      inputShape[field.name] = this.buildZodField(field);
    }

    // Build output schema
    const outputShape: Record<string, z.ZodSchema> = {};
    const validOutputFields = schemaDefinition.output.fields.filter(field => field.name.trim());
    
    for (const field of validOutputFields) {
      outputShape[field.name] = this.buildZodField(field);
    }

    // Handle different output scenarios
    let outputSchema: z.ZodSchema;
    if (validOutputFields.length === 0) {
      outputSchema = z.any();
    } else if (validOutputFields.length === 1) {
      // Single field output - return the field directly
      outputSchema = outputShape[validOutputFields[0].name];
    } else {
      // Multi-field output - return as object
      outputSchema = z.object(outputShape);
    }

    return {
      inputSchema: z.object(inputShape),
      outputSchema,
      inputFields: validInputFields,
      outputFields: validOutputFields
    };
  }

  /**
   * Validate data against schema definition
   */
  static validateData(
    data: any, 
    fields: SchemaField[], 
    isInput = true
  ): SchemaValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = [];

    for (const field of fields) {
      const value = data[field.name];
      
      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} is required`
        });
        continue;
      }

      // Skip validation for optional empty fields
      if (!field.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      const typeError = this.validateFieldType(value, field);
      if (typeError) {
        errors.push({
          field: field.name,
          message: typeError,
          value
        });
        continue;
      }

      // Validation rules
      if (field.validation) {
        const ruleErrors = this.validateFieldRules(value, field);
        errors.push(...ruleErrors.map(error => ({
          field: field.name,
          message: error,
          value
        })));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined
    };
  }

  /**
   * Validate field type
   */
  private static validateFieldType(value: any, field: SchemaField): string | null {
    switch (field.type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field.label || field.name} must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field.label || field.name} must be a valid number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field.label || field.name} must be true or false`;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `${field.label || field.name} must be a valid email address`;
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          return `${field.label || field.name} must be a valid URL`;
        }
        break;
      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return `${field.label || field.name} must be a valid date`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return `${field.label || field.name} must be an array`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return `${field.label || field.name} must be an object`;
        }
        break;
    }
    return null;
  }

  /**
   * Validate field rules
   */
  private static validateFieldRules(value: any, field: SchemaField): string[] {
    const errors: string[] = [];
    const rules = field.validation;
    
    if (!rules) return errors;

    // String validations
    if (field.type === 'string' && typeof value === 'string') {
      if (rules.min !== undefined && value.length < rules.min) {
        errors.push(`${field.label || field.name} must be at least ${rules.min} characters long`);
      }
      
      if (rules.max !== undefined && value.length > rules.max) {
        errors.push(`${field.label || field.name} must be at most ${rules.max} characters long`);
      }
      
      if (rules.pattern) {
        try {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            errors.push(`${field.label || field.name} format is invalid`);
          }
        } catch {
          // Invalid regex - skip validation
        }
      }
      
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field.label || field.name} must be one of: ${rules.enum.join(', ')}`);
      }
    }

    // Number validations
    if (field.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field.label || field.name} must be at least ${rules.min}`);
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field.label || field.name} must be at most ${rules.max}`);
      }
    }

    // Custom validation
    if (rules.custom) {
      try {
        const validator = new Function('return ' + rules.custom.validator)();
        if (!validator(value)) {
          errors.push(rules.custom.message);
        }
      } catch {
        // Invalid validator - skip
      }
    }

    return errors;
  }

  /**
   * Generate TypeScript interface from schema
   */
  static generateTypeScriptInterface(schemaDefinition: SchemaDefinition): string {
    const generateFieldType = (field: SchemaField): string => {
      let baseType: string;
      
      switch (field.type) {
        case 'string':
        case 'email':
        case 'url':
          baseType = 'string';
          break;
        case 'number':
          baseType = 'number';
          break;
        case 'boolean':
          baseType = 'boolean';
          break;
        case 'date':
          baseType = 'Date';
          break;
        case 'array':
          baseType = 'any[]';
          break;
        case 'object':
          baseType = 'Record<string, any>';
          break;
        default:
          baseType = 'any';
      }
      
      if (field.validation?.enum) {
        baseType = field.validation.enum.map(v => `'${v}'`).join(' | ');
      }
      
      return field.required ? baseType : `${baseType} | undefined`;
    };

    const inputInterface = schemaDefinition.input.fields
      .map(field => `  ${field.name}: ${generateFieldType(field)};`)
      .join('\n');

    const outputInterface = schemaDefinition.output.fields
      .map(field => `  ${field.name}: ${generateFieldType(field)};`)
      .join('\n');

    return `
// Generated interfaces for ${schemaDefinition.name}

export interface ${schemaDefinition.name}Input {
${inputInterface}
}

export interface ${schemaDefinition.name}Output {
${outputInterface}
}`;
  }
}