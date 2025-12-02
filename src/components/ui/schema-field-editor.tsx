/**
 * Schema Field Editor Component
 * Individual field configuration component
 */

'use client';

import React, { useState, useRef } from 'react';
import { Trash2, ChevronDown, ChevronUp, Settings, Copy } from 'lucide-react';
import { SchemaField, FieldType, ValidationRule } from '@/ai/core/types';

interface SchemaFieldEditorProps {
  field: SchemaField;
  index: number;
  isInput: boolean;
  onUpdate: (field: SchemaField) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const fieldTypes: Array<{ value: FieldType; label: string; description: string }> = [
  { value: 'string', label: 'Text', description: 'Any text input' },
  { value: 'number', label: 'Number', description: 'Numeric value' },
  { value: 'boolean', label: 'Boolean', description: 'True/False value' },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'url', label: 'URL', description: 'Website URL' },
  { value: 'date', label: 'Date', description: 'Date value' },
  { value: 'array', label: 'Array', description: 'List of values' },
  { value: 'object', label: 'Object', description: 'Complex object' },
];

export function SchemaFieldEditor({
  field,
  index,
  isInput,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: SchemaFieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const updateField = (updates: Partial<SchemaField>) => {
    onUpdate({ ...field, ...updates });
  };

  const updateValidation = (updates: Partial<ValidationRule>) => {
    const validation = field.validation || {};
    updateField({ validation: { ...validation, ...updates } });
  };

  const addEnumValue = () => {
    const current = field.validation?.enum || [];
    updateValidation({ enum: [...current, ''] });
  };

  const updateEnumValue = (index: number, value: string) => {
    const current = field.validation?.enum || [];
    const updated = [...current];
    updated[index] = value;
    updateValidation({ enum: updated });
  };

  const removeEnumValue = (index: number) => {
    const current = field.validation?.enum || [];
    updateValidation({ enum: current.filter((_, i) => i !== index) });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          <div>
            <h4 className="font-medium text-gray-900">
              {field.name || `${isInput ? 'Input' : 'Output'} Field #${index + 1}`}
            </h4>
            <p className="text-sm text-gray-500">
              {fieldTypes.find(t => t.value === field.type)?.label || field.type}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Move buttons */}
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            title="Move up"
          >
            <ChevronUp className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            title="Move down"
          >
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {/* Actions */}
          <button
            onClick={onDuplicate}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Duplicate field"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>

          <button
            onClick={() => setShowValidation(!showValidation)}
            className={`p-1 rounded transition-colors ${
              showValidation ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Validation settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onRemove}
            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
            title="Remove field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={field.name}
                onChange={(e) => updateField({ name: e.target.value })}
                placeholder="e.g., userPrompt, systemMessage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {field.name && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field.name) && (
                <p className="text-xs text-red-500 mt-1">
                  Field name must be a valid JavaScript identifier
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type *
              </label>
              <select
                value={field.type}
                onChange={(e) => updateField({ type: e.target.value as FieldType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {fieldTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Label
              </label>
              <input
                type="text"
                value={field.label || ''}
                onChange={(e) => updateField({ label: e.target.value })}
                placeholder="Human-readable label"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                placeholder="Placeholder text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={field.description}
              onChange={(e) => updateField({ description: e.target.value })}
              placeholder="Describe what this field is for..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Settings */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField({ required: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Required field</span>
            </label>

            {!field.required && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Default Value:</label>
                <input
                  type="text"
                  value={field.defaultValue?.toString() || ''}
                  onChange={(e) => updateField({ defaultValue: e.target.value })}
                  placeholder="Optional default"
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Rules */}
      {showValidation && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h5 className="font-medium text-gray-800 mb-3">Validation Rules</h5>
          
          <div className="space-y-4">
            {/* String/Number min/max */}
            {(field.type === 'string' || field.type === 'number') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {field.type === 'string' ? 'Min Length' : 'Min Value'}
                  </label>
                  <input
                    type="number"
                    value={field.validation?.min || ''}
                    onChange={(e) => updateValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {field.type === 'string' ? 'Max Length' : 'Max Value'}
                  </label>
                  <input
                    type="number"
                    value={field.validation?.max || ''}
                    onChange={(e) => updateValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            )}

            {/* Pattern for strings */}
            {field.type === 'string' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Pattern (Regex)
                </label>
                <input
                  type="text"
                  value={field.validation?.pattern || ''}
                  onChange={(e) => updateValidation({ pattern: e.target.value })}
                  placeholder="^[A-Za-z]+$"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                />
              </div>
            )}

            {/* Enum values */}
            {field.type === 'string' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600">
                    Allowed Values (Enum)
                  </label>
                  <button
                    onClick={addEnumValue}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + Add Value
                  </button>
                </div>
                
                {(field.validation?.enum || []).map((value, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateEnumValue(index, e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => removeEnumValue(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom validation */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Custom Validation Function
              </label>
              <textarea
                value={field.validation?.custom?.validator || ''}
                onChange={(e) => updateValidation({ 
                  custom: { 
                    ...field.validation?.custom,
                    validator: e.target.value 
                  } 
                })}
                placeholder="(value) => value.length > 0"
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
              />
              
              {field.validation?.custom?.validator && (
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Error Message
                  </label>
                  <input
                    type="text"
                    value={field.validation?.custom?.message || ''}
                    onChange={(e) => updateValidation({ 
                      custom: { 
                        ...field.validation?.custom,
                        message: e.target.value 
                      } 
                    })}
                    placeholder="Custom validation error message"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}