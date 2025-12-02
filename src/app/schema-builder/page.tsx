/**
 * Schema Builder Page
 * Main page for building and testing dynamic AI schemas
 */

'use client';

import React, { useState } from 'react';
import { Save, Play, Download, Upload, Trash2 } from 'lucide-react';
import { DynamicSchemaBuilder } from '@/components/ui/dynamic-schema-builder';
import { AIFlowTester } from '@/components/ui/ai-flow-tester';
import { SchemaDefinition, FlowConfig } from '@/ai/core/types';
import { DynamicFlowEngine } from '@/ai/core/dynamic-flow-engine';

type ViewMode = 'builder' | 'tester' | 'split';

export default function SchemaBuilderPage() {
  const [currentSchema, setCurrentSchema] = useState<SchemaDefinition | null>(null);
  const [savedSchemas, setSavedSchemas] = useState<SchemaDefinition[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('builder');
  const [flowConfig, setFlowConfig] = useState<FlowConfig>({
    name: 'customFlow',
    model: 'googleai/gemini-2.5-flash-lite',
    temperature: 0.7,
    streaming: false
  });

  // Save schema to local storage and state
  const saveSchema = (schema: SchemaDefinition) => {
    const updatedSchemas = savedSchemas.filter(s => s.id !== schema.id);
    const newSchemas = [...updatedSchemas, schema];
    
    setSavedSchemas(newSchemas);
    localStorage.setItem('ai-schemas', JSON.stringify(newSchemas));
    
    // Also save to dynamic flow engine
    try {
      const validation = DynamicFlowEngine.validateSchema(schema);
      if (validation.valid) {
        DynamicFlowEngine.createFlow(schema, flowConfig);
      }
    } catch (error) {
      console.error('Failed to create dynamic flow:', error);
    }
  };

  // Load schemas from local storage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('ai-schemas');
      if (stored) {
        const schemas = JSON.parse(stored);
        setSavedSchemas(schemas);
        
        // Load schemas into dynamic flow engine
        schemas.forEach((schema: SchemaDefinition) => {
          try {
            DynamicFlowEngine.createFlow(schema, flowConfig);
          } catch (error) {
            console.warn('Failed to load schema into engine:', schema.name);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load schemas from storage:', error);
    }
  }, []);

  // Load a saved schema
  const loadSchema = (schema: SchemaDefinition) => {
    setCurrentSchema(schema);
    setFlowConfig(prev => ({ ...prev, name: `${schema.name}Flow` }));
  };

  // Delete a saved schema
  const deleteSchema = (schemaId: string) => {
    const updatedSchemas = savedSchemas.filter(s => s.id !== schemaId);
    setSavedSchemas(updatedSchemas);
    localStorage.setItem('ai-schemas', JSON.stringify(updatedSchemas));
    
    // Remove from dynamic flow engine
    DynamicFlowEngine.deleteFlow(schemaId);
    
    // Clear current schema if it was deleted
    if (currentSchema?.id === schemaId) {
      setCurrentSchema(null);
    }
  };

  // Export schema as JSON file
  const exportSchema = (schema: SchemaDefinition) => {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.name.replace(/\s+/g, '_')}_schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import schema from JSON file
  const importSchema = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSchema: SchemaDefinition = JSON.parse(e.target?.result as string);
        
        // Validate imported schema
        const validation = DynamicFlowEngine.validateSchema(importedSchema);
        if (!validation.valid) {
          alert(`Invalid schema: ${validation.errors.join(', ')}`);
          return;
        }

        // Generate new ID to avoid conflicts
        importedSchema.id = `schema_${Date.now()}`;
        importedSchema.metadata.updatedAt = new Date().toISOString();
        
        setCurrentSchema(importedSchema);
        saveSchema(importedSchema);
      } catch (error) {
        alert('Invalid schema file format');
      }
    };
    reader.readAsText(file);
    
    // Clear the input
    event.target.value = '';
  };

  // Test the current schema
  const testSchema = (schema: SchemaDefinition) => {
    setCurrentSchema(schema);
    setViewMode('tester');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Schema Builder</h1>
              <p className="text-sm text-gray-600">Create dynamic schemas for AI flows</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('builder')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'builder'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Builder
                </button>
                <button
                  onClick={() => setViewMode('tester')}
                  disabled={!currentSchema}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'tester'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
                  }`}
                >
                  Tester
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  disabled={!currentSchema}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'split'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
                  }`}
                >
                  Split View
                </button>
              </div>

              {/* Import Button */}
              <label className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importSchema}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Saved Schemas Sidebar */}
        {savedSchemas.length > 0 && (
          <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Schemas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedSchemas.map((schema) => (
                <div
                  key={schema.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors hover:border-blue-300 ${
                    currentSchema?.id === schema.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => loadSchema(schema)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{schema.name}</h3>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSchema(schema);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Export schema"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSchema(schema.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete schema"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {schema.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{schema.input.fields.length} inputs</span>
                    <span>{schema.output.fields.length} outputs</span>
                    <span>v{schema.version}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-8">
          {viewMode === 'builder' && (
            <DynamicSchemaBuilder
              initialSchema={currentSchema || undefined}
              onSchemaChange={setCurrentSchema}
              onSave={saveSchema}
              onTest={testSchema}
            />
          )}

          {viewMode === 'tester' && currentSchema && (
            <AIFlowTester
              schema={currentSchema}
              onConfigChange={setFlowConfig}
              initialConfig={flowConfig}
            />
          )}

          {viewMode === 'split' && currentSchema && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Schema Builder</h2>
                <DynamicSchemaBuilder
                  initialSchema={currentSchema}
                  onSchemaChange={setCurrentSchema}
                  onSave={saveSchema}
                  onTest={testSchema}
                />
              </div>
              
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Flow Tester</h2>
                <AIFlowTester
                  schema={currentSchema}
                  onConfigChange={setFlowConfig}
                  initialConfig={flowConfig}
                />
              </div>
            </div>
          )}

          {!currentSchema && viewMode !== 'builder' && (
            <div className="text-center py-12">
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Schema Selected</h3>
                <p className="text-gray-600 mb-4">
                  Create a new schema or select an existing one to get started with testing.
                </p>
                <button
                  onClick={() => setViewMode('builder')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Builder
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        {savedSchemas.length > 0 && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{savedSchemas.length}</div>
                <div className="text-sm text-gray-600">Total Schemas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {savedSchemas.reduce((sum, schema) => sum + schema.input.fields.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Input Fields</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {savedSchemas.reduce((sum, schema) => sum + schema.output.fields.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Output Fields</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {DynamicFlowEngine.listFlows().length}
                </div>
                <div className="text-sm text-gray-600">Active Flows</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}