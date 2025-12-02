/**
 * AI Flow Tester Component
 * Test and execute AI flows with dynamic schemas
 */

'use client';

import React, { useState, useRef } from 'react';
import { Play, Square, Download, Upload, Settings, Loader } from 'lucide-react';
import { SchemaDefinition, FlowConfig } from '@/ai/core/types';
import { DynamicFlowEngine } from '@/ai/core/dynamic-flow-engine';
import { SchemaConverter } from '@/ai/core/schema-converter';

interface AIFlowTesterProps {
  schema: SchemaDefinition;
  onConfigChange?: (config: FlowConfig) => void;
  initialConfig?: FlowConfig;
}

export function AIFlowTester({ 
  schema, 
  onConfigChange,
  initialConfig 
}: AIFlowTesterProps) {
  const [config, setConfig] = useState<FlowConfig>(
    initialConfig || {
      name: `${schema.name}Flow`,
      model: 'googleai/gemini-2.5-flash-lite',
      temperature: 0.7,
      streaming: false
    }
  );
  
  const [inputData, setInputData] = useState<Record<string, any>>({});
  const [outputData, setOutputData] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<Array<{
    timestamp: string;
    input: any;
    output: any;
    success: boolean;
    duration: number;
    error?: string;
  }>>([]);
  
  const [showConfig, setShowConfig] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update config and notify parent
  const updateConfig = (updates: Partial<FlowConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  // Handle input field changes
  const handleInputChange = (fieldName: string, value: any) => {
    setInputData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => error.field !== fieldName));
  };

  // Validate input data
  const validateInput = () => {
    const validation = SchemaConverter.validateData(inputData, schema.input.fields, true);
    setValidationErrors(validation.errors);
    return validation.valid;
  };

  // Execute the AI flow
  const executeFlow = async () => {
    if (!validateInput()) {
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      // Create or get the dynamic flow
      const dynamicFlow = DynamicFlowEngine.getDynamicFlow(schema.id) ||
        DynamicFlowEngine.createFlow(schema, config);

      // Execute the flow
      const result = await DynamicFlowEngine.executeFlow(schema.id, inputData, {
        validateInput: true,
        validateOutput: true
      });

      const duration = Date.now() - startTime;

      if (result.success) {
        setOutputData(result.result);
        setExecutionHistory(prev => [{
          timestamp: new Date().toISOString(),
          input: { ...inputData },
          output: result.result,
          success: true,
          duration
        }, ...prev.slice(0, 9)]); // Keep last 10 executions
      } else {
        const errorMessage = result.errors?.join(', ') || 
                           result.validationErrors?.map(e => e.message).join(', ') ||
                           'Unknown error';
        
        setExecutionHistory(prev => [{
          timestamp: new Date().toISOString(),
          input: { ...inputData },
          output: null,
          success: false,
          duration,
          error: errorMessage
        }, ...prev.slice(0, 9)]);

        setValidationErrors(result.validationErrors || []);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setExecutionHistory(prev => [{
        timestamp: new Date().toISOString(),
        input: { ...inputData },
        output: null,
        success: false,
        duration,
        error: errorMessage
      }, ...prev.slice(0, 9)]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Render input field based on type
  const renderInputField = (field: any) => {
    const value = inputData[field.name] || (field.defaultValue ?? '');
    const hasError = validationErrors.some(error => error.field === field.name);

    const baseClassName = `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

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
            className={baseClassName}
            required={field.required}
            minLength={field.validation?.min}
            maxLength={field.validation?.max}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.name, Number(e.target.value))}
            placeholder={field.placeholder}
            className={baseClassName}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            step="any"
          />
        );
      
      case 'boolean':
        return (
          <select
            value={value.toString()}
            onChange={(e) => handleInputChange(field.name, e.target.value === 'true')}
            className={baseClassName}
            required={field.required}
          >
            {!field.required && <option value="">Not specified</option>}
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
            className={baseClassName}
            required={field.required}
          />
        );
      
      case 'array':
      case 'object':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange(field.name, parsed);
              } catch {
                // Keep as string if invalid JSON
                handleInputChange(field.name, e.target.value);
              }
            }}
            placeholder={field.placeholder || `Enter ${field.type} data as JSON`}
            rows={4}
            className={baseClassName}
            required={field.required}
          />
        );
      
      default:
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.description}
            rows={3}
            className={baseClassName}
            required={field.required}
          />
        );
    }
  };

  // Export test data
  const exportTestData = () => {
    const data = {
      schema: schema.id,
      config,
      input: inputData,
      output: outputData,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.name}_test_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import test data
  const importTestData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.input) setInputData(data.input);
        if (data.config) setConfig(data.config);
      } catch (error) {
        alert('Invalid test data file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Flow Tester</h2>
          <p className="text-gray-600">Test your {schema.name} schema</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-lg border transition-colors ${
              showConfig ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
            }`}
            title="Configuration"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importTestData}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Import test data"
          >
            <Upload className="w-5 h-5" />
          </button>
          
          <button
            onClick={exportTestData}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Export test data"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Flow Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                value={config.model}
                onChange={(e) => updateConfig({ model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="googleai/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="googleai/gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="googleai/gemini-pro">Gemini Pro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature ({config.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => updateConfig({ temperature: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={config.maxTokens || ''}
                onChange={(e) => updateConfig({ maxTokens: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Default"
                min="1"
                max="8192"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt Override
            </label>
            <textarea
              value={config.systemPrompt || ''}
              onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
              placeholder="Leave empty to use schema default"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Input Data</h3>
          <button
            onClick={executeFlow}
            disabled={isExecuting || schema.input.fields.length === 0}
            className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
              isExecuting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Execute Flow
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {schema.input.fields.map((field, index) => {
            const fieldErrors = validationErrors.filter(error => error.field === field.name);
            
            return (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label || field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {renderInputField(field)}
                
                {field.description && (
                  <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                )}
                
                {fieldErrors.length > 0 && (
                  <div className="mt-1">
                    {fieldErrors.map((error, errorIndex) => (
                      <p key={errorIndex} className="text-sm text-red-600">
                        {error.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {schema.input.fields.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No input fields defined in schema
          </div>
        )}
      </div>

      {/* Output Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Output</h3>
        
        {outputData ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto">
              {typeof outputData === 'string' ? outputData : JSON.stringify(outputData, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Execute the flow to see output results
          </div>
        )}
      </div>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution History</h3>
          
          <div className="space-y-3">
            {executionHistory.map((execution, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  execution.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${
                      execution.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {new Date(execution.timestamp).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {execution.duration}ms
                    </span>
                  </div>
                  
                  {!execution.success && execution.error && (
                    <span className="text-sm text-red-600">
                      {execution.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}