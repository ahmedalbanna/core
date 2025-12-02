/**
 * Schema Preview Components
 * Preview and code view components for schemas
 */

'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { SchemaDefinition } from '@/ai/core/types';
import { SchemaConverter } from '@/ai/core/schema-converter';

interface SchemaPreviewProps {
  schema: SchemaDefinition;
}

export function SchemaPreview({ schema }: SchemaPreviewProps) {
  const [testInput, setTestInput] = useState<Record<string, any>>({});
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleInputChange = (fieldName: string, value: any) => {
    setTestInput(prev => ({ ...prev, [fieldName]: value }));
  };

  const validateInput = () => {
    const result = SchemaConverter.validateData(testInput, schema.input.fields, true);
    setValidationResult(result);
  };

  const renderInputField = (field: any) => {
    const value = testInput[field.name] || '';

    switch (field.type) {
      case 'string':
      case 'email':
      case 'url':
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.description}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.name, Number(e.target.value))}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );
      
      case 'boolean':
        return (
          <select
            value={value.toString()}
            onChange={(e) => handleInputChange(field.name, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );
      
      default:
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = field.type === 'object' || field.type === 'array' 
                  ? JSON.parse(e.target.value) 
                  : e.target.value;
                handleInputChange(field.name, parsed);
              } catch {
                handleInputChange(field.name, e.target.value);
              }
            }}
            placeholder={field.placeholder || `Enter ${field.type} data`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Schema Overview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schema Overview</h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Name</dt>
            <dd className="text-gray-900">{schema.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Version</dt>
            <dd className="text-gray-900">{schema.version}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Input Fields</dt>
            <dd className="text-gray-900">{schema.input.fields.length}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Output Fields</dt>
            <dd className="text-gray-900">{schema.output.fields.length}</dd>
          </div>
        </dl>
        {schema.description && (
          <div className="mt-4">
            <dt className="font-medium text-gray-500">Description</dt>
            <dd className="text-gray-900 mt-1">{schema.description}</dd>
          </div>
        )}
      </div>

      {/* Input Form Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Input Form Preview</h3>
          <button
            onClick={validateInput}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Validate Input
          </button>
        </div>

        <div className="space-y-4">
          {schema.input.fields.map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label || field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderInputField(field)}
              {field.description && (
                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            validationResult.valid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-medium ${
              validationResult.valid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validationResult.valid ? '✅ Validation Passed' : '❌ Validation Failed'}
            </h4>
            {!validationResult.valid && validationResult.errors.length > 0 && (
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {validationResult.errors.map((error: any, index: number) => (
                  <li key={index}>• {error.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Output Structure Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Output Structure Preview</h3>
        <div className="space-y-3">
          {schema.output.fields.map((field, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <div>
                <span className="font-medium text-gray-900">{field.name}</span>
                <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                {!field.required && <span className="text-xs text-gray-400 ml-1">optional</span>}
              </div>
              {field.description && (
                <span className="text-sm text-gray-600">{field.description}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* JSON Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">JSON Structure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Input JSON</h4>
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-64">
              {JSON.stringify(
                Object.fromEntries(
                  schema.input.fields.map(field => [
                    field.name, 
                    field.type === 'string' ? 'sample text' :
                    field.type === 'number' ? 42 :
                    field.type === 'boolean' ? true :
                    field.type === 'array' ? ['item1', 'item2'] :
                    field.type === 'object' ? { key: 'value' } :
                    'sample value'
                  ])
                ),
                null,
                2
              )}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Output JSON</h4>
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-64">
              {JSON.stringify(
                schema.output.fields.length === 1 && schema.output.fields[0].type === 'string'
                  ? 'AI generated response...'
                  : Object.fromEntries(
                      schema.output.fields.map(field => [
                        field.name,
                        field.type === 'string' ? 'AI generated response...' :
                        field.type === 'number' ? 95.5 :
                        field.type === 'boolean' ? true :
                        field.type === 'array' ? ['result1', 'result2'] :
                        field.type === 'object' ? { analysis: 'detailed' } :
                        'AI result'
                      ])
                    ),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SchemaCodeView({ schema }: SchemaCodeViewProps) {
  const [activeTab, setActiveTab] = useState<'typescript' | 'zod' | 'json'>('typescript');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateZodCode = () => {
    try {
      const { inputSchema, outputSchema } = SchemaConverter.convertToZod(schema);
      return `import { z } from 'zod';

// Generated Zod schemas for ${schema.name}

const ${schema.name}InputSchema = ${inputSchema.toString()};

const ${schema.name}OutputSchema = ${outputSchema.toString()};

export { ${schema.name}InputSchema, ${schema.name}OutputSchema };`;
    } catch (error) {
      return `// Error generating Zod schemas: ${error.message}`;
    }
  };

  const generateTypeScriptCode = () => {
    return SchemaConverter.generateTypeScriptInterface(schema);
  };

  const generateFlowCode = () => {
    return `import { ai } from '@/ai/genkit';
import { ${schema.name}InputSchema, ${schema.name}OutputSchema } from './schemas';

export const ${schema.name.toLowerCase()}Flow = ai.defineFlow(
  {
    name: '${schema.name.toLowerCase()}Flow',
    inputSchema: ${schema.name}InputSchema,
    outputSchema: ${schema.name}OutputSchema,
  },
  async (input) => {
    // Your AI flow implementation here
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: input.userPrompt || input.message,
      system: input.systemPrompt || 'You are a helpful AI assistant.',
      config: {
        temperature: 0.7,
      },
    });

    return response.text;
  }
);`;
  };

  const getCodeContent = () => {
    switch (activeTab) {
      case 'typescript':
        return generateTypeScriptCode() + '\n\n' + generateFlowCode();
      case 'zod':
        return generateZodCode();
      case 'json':
        return JSON.stringify(schema, null, 2);
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Code Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('typescript')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'typescript'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => setActiveTab('zod')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'zod'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Zod Schemas
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'json'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            JSON
          </button>
        </div>

        <button
          onClick={() => copyToClipboard(getCodeContent())}
          className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code Display */}
      <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-auto">
        <pre className="text-sm">
          <code>{getCodeContent()}</code>
        </pre>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Usage Instructions</h4>
        <div className="text-sm text-blue-800 space-y-2">
          {activeTab === 'typescript' && (
            <p>Copy this TypeScript code to create type-safe interfaces and AI flow implementation.</p>
          )}
          {activeTab === 'zod' && (
            <p>Copy these Zod schemas to validate input and output data at runtime.</p>
          )}
          {activeTab === 'json' && (
            <p>Copy this JSON to save, share, or import the schema configuration.</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SchemaCodeViewProps {
  schema: SchemaDefinition;
}