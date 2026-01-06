/**
 * Dynamic Schema Builder Component
 * Main component for building schemas visually
 */

'use client';

import { Code, Eye, Play, Plus, Save } from 'lucide-react';
import { useCallback, useState } from 'react';
import { DynamicFlowEngine } from '../../ai/core/dynamic-flow-engine';
import { FieldType, SchemaDefinition, SchemaField } from '../../ai/core/types';
import { SchemaFieldEditor } from './schema-field-editor';
import { SchemaCodeView, SchemaPreview } from './schema-preview';
interface DynamicSchemaBuilderProps {
  initialSchema?: SchemaDefinition;
  onSchemaChange?: (schema: SchemaDefinition) => void;
  onSave?: (schema: SchemaDefinition) => void;
  onTest?: (schema: SchemaDefinition) => void;
  readonly?: boolean;
}

export function DynamicSchemaBuilder({
  initialSchema,
  onSchemaChange,
  onSave,
  onTest,
  readonly = false
}: DynamicSchemaBuilderProps) {
  const [schema, setSchema] = useState<SchemaDefinition>(
    initialSchema || createEmptySchema()
  );
  const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'code'>('build');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Create empty schema
  function createEmptySchema(): SchemaDefinition {
    return {
      id: `schema_${Date.now()}`,
      name: 'New Schema',
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

  // Update schema and notify parent
  const updateSchema = useCallback((updates: Partial<SchemaDefinition>) => {
    const updatedSchema = {
      ...schema,
      ...updates,
      metadata: {
        ...schema.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    setSchema(updatedSchema);
    onSchemaChange?.(updatedSchema);
  }, [schema, onSchemaChange]);

  // Add new field
  const addField = (isInput: boolean) => {
    const newField: SchemaField = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'string' as FieldType,
      description: '',
      required: true,
      order: isInput ? schema.input.fields.length : schema.output.fields.length
    };

    if (isInput) {
      updateSchema({
        input: {
          fields: [...schema.input.fields, newField]
        }
      });
    } else {
      updateSchema({
        output: {
          fields: [...schema.output.fields, newField]
        }
      });
    }
  };

  // Update field
  const updateField = (index: number, field: SchemaField, isInput: boolean) => {
    if (isInput) {
      const fields = [...schema.input.fields];
      fields[index] = field;
      updateSchema({ input: { fields } });
    } else {
      const fields = [...schema.output.fields];
      fields[index] = field;
      updateSchema({ output: { fields } });
    }
  };

  // Remove field
  const removeField = (index: number, isInput: boolean) => {
    if (isInput) {
      const fields = schema.input.fields.filter((_, i) => i !== index);
      updateSchema({ input: { fields } });
    } else {
      const fields = schema.output.fields.filter((_, i) => i !== index);
      updateSchema({ output: { fields } });
    }
  };

  // Duplicate field
  const duplicateField = (index: number, isInput: boolean) => {
    const fields = isInput ? schema.input.fields : schema.output.fields;
    const fieldToDuplicate = fields[index];
    const newField: SchemaField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      name: `${fieldToDuplicate.name}_copy`,
      order: fields.length
    };

    if (isInput) {
      updateSchema({
        input: { fields: [...fields, newField] }
      });
    } else {
      updateSchema({
        output: { fields: [...fields, newField] }
      });
    }
  };

  // Move field
  const moveField = (index: number, direction: 'up' | 'down', isInput: boolean) => {
    const fields = isInput ? [...schema.input.fields] : [...schema.output.fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < fields.length) {
      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];

      if (isInput) {
        updateSchema({ input: { fields } });
      } else {
        updateSchema({ output: { fields } });
      }
    }
  };

  // Validate schema
  const validateSchema = () => {
    const validation = DynamicFlowEngine.validateSchema(schema);
    setValidationErrors(validation.errors);
    return validation.valid;
  };

  // Save schema
  const handleSave = () => {
    if (validateSchema()) {
      onSave?.(schema);
    }
  };

  // Test schema
  const handleTest = () => {
    if (validateSchema()) {
      onTest?.(schema);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schema Builder</h2>
            <p className="text-gray-600 mt-1">Design your AI flow input and output schemas</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('build')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'build'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Build
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'preview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Eye className="w-4 h-4 mr-1 inline" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'code'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Code className="w-4 h-4 mr-1 inline" />
                Code
              </button>
            </div>

            {/* Action Buttons */}
            {!readonly && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTest}
                  className="flex items-center px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schema Metadata */}
      {activeTab === 'build' && (
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schema Name *
              </label>
              <input
                type="text"
                value={schema.name}
                onChange={(e) => updateSchema({ name: e.target.value })}
                placeholder="Enter schema name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={readonly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="text"
                value={schema.version}
                onChange={(e) => updateSchema({ version: e.target.value })}
                placeholder="1.0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={readonly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={schema.metadata.tags.join(', ')}
                onChange={(e) => updateSchema({
                  metadata: {
                    ...schema.metadata,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  }
                })}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={readonly}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={schema.description}
              onChange={(e) => updateSchema({ description: e.target.value })}
              placeholder="Describe what this schema is used for..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={readonly}
            />
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Schema Validation Errors
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'build' && (
          <div className="space-y-8">
            {/* Input Fields Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Input Schema</h3>
                  <p className="text-gray-600">Define the input fields for your AI flow</p>
                </div>
                {!readonly && (
                  <button
                    onClick={() => addField(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Input Field
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {schema.input.fields.map((field, index) => (
                  <SchemaFieldEditor
                    key={field.id}
                    field={field}
                    index={index}
                    isInput={true}
                    onUpdate={(updatedField) => updateField(index, updatedField, true)}
                    onRemove={() => removeField(index, true)}
                    onDuplicate={() => duplicateField(index, true)}
                    onMoveUp={() => moveField(index, 'up', true)}
                    onMoveDown={() => moveField(index, 'down', true)}
                    canMoveUp={index > 0}
                    canMoveDown={index < schema.input.fields.length - 1}
                  />
                ))}

                {schema.input.fields.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No input fields defined yet</p>
                    {!readonly && (
                      <button
                        onClick={() => addField(true)}
                        className="mt-2 text-blue-600 hover:text-blue-700"
                      >
                        Add your first input field
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Output Fields Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Output Schema</h3>
                  <p className="text-gray-600">Define the output structure of your AI flow</p>
                </div>
                {!readonly && (
                  <button
                    onClick={() => addField(false)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Output Field
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {schema.output.fields.map((field, index) => (
                  <SchemaFieldEditor
                    key={field.id}
                    field={field}
                    index={index}
                    isInput={false}
                    onUpdate={(updatedField) => updateField(index, updatedField, false)}
                    onRemove={() => removeField(index, false)}
                    onDuplicate={() => duplicateField(index, false)}
                    onMoveUp={() => moveField(index, 'up', false)}
                    onMoveDown={() => moveField(index, 'down', false)}
                    canMoveUp={index > 0}
                    canMoveDown={index < schema.output.fields.length - 1}
                  />
                ))}

                {schema.output.fields.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No output fields defined yet</p>
                    {!readonly && (
                      <button
                        onClick={() => addField(false)}
                        className="mt-2 text-green-600 hover:text-green-700"
                      >
                        Add your first output field
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && <SchemaPreview schema={schema} />}
        {activeTab === 'code' && <SchemaCodeView schema={schema} />}
      </div>
    </div>
  );
}
