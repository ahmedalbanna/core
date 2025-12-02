# Dynamic AI Schema Builder & Flow Engine

A comprehensive system for building dynamic schemas and AI flows through an intuitive React interface. This system allows users to define input/output schemas visually and automatically generates native Zod schemas for use with AI flows.

## 🚀 Features

- **Visual Schema Builder**: Drag-and-drop interface for creating complex schemas
- **Dynamic Flow Engine**: Runtime creation and execution of AI flows
- **Type Safety**: Automatic conversion to Zod schemas with full TypeScript support
- **Real-time Validation**: Client and server-side validation with detailed error messages
- **Flow Testing**: Built-in testing interface for validating schemas and flows
- **Import/Export**: Save and share schemas as JSON files
- **Code Generation**: Auto-generate TypeScript interfaces and Zod schemas

## 📁 Project Structure

```
src/
├── ai/core/                    # Core dynamic schema engine
│   ├── types.ts               # TypeScript type definitions
│   ├── schema-converter.ts    # Zod schema conversion engine
│   ├── dynamic-flow-engine.ts # AI flow creation and management
│   ├── utils.ts              # Utility functions
│   └── index.ts              # Barrel exports
├── components/ui/             # React UI components
│   ├── schema-field-editor.tsx    # Individual field configuration
│   ├── dynamic-schema-builder.tsx # Main schema builder interface
│   ├── schema-preview.tsx         # Schema preview and validation
│   └── ai-flow-tester.tsx         # Flow testing interface
└── app/schema-builder/        # Next.js page
    └── page.tsx              # Main application page
```

## 🛠️ Core Components

### 1. Dynamic Schema Engine (`src/ai/core/`)

#### `types.ts`
Defines the core TypeScript interfaces:
- `SchemaField`: Individual field configuration
- `SchemaDefinition`: Complete schema structure
- `FlowConfig`: AI flow configuration
- `ValidationRule`: Field validation rules

#### `schema-converter.ts`
Converts UI-defined schemas to Zod schemas:
```typescript
const { inputSchema, outputSchema } = SchemaConverter.convertToZod(schemaDefinition);
```

#### `dynamic-flow-engine.ts`
Creates and manages dynamic AI flows:
```typescript
const flow = DynamicFlowEngine.createFlow(schema, config, implementation);
const result = await DynamicFlowEngine.executeFlow(schemaId, input);
```

### 2. UI Components (`src/components/ui/`)

#### `DynamicSchemaBuilder`
Main schema building interface with:
- Field management (add, edit, remove, reorder)
- Real-time validation
- Schema metadata editing
- Export/import functionality

#### `SchemaFieldEditor`
Individual field configuration with:
- Field type selection
- Validation rule configuration
- Display options
- Advanced settings

#### `AIFlowTester`
Testing interface featuring:
- Dynamic form generation
- Real-time validation
- Flow execution
- Result display
- Execution history

## 🎯 Usage Examples

### Basic Schema Creation

```typescript
import { DynamicFlowEngine, createEmptySchema } from '@/ai/core';

// Create a new schema
const schema = createEmptySchema('My AI Flow');

// Add input fields
schema.input.fields.push({
  id: 'field_1',
  name: 'userPrompt',
  type: 'string',
  description: 'User input prompt',
  required: true
});

// Add output field
schema.output.fields.push({
  id: 'field_2', 
  name: 'response',
  type: 'string',
  description: 'AI generated response',
  required: true
});

// Create the flow
const config = {
  name: 'myFlow',
  model: 'googleai/gemini-2.5-flash-lite',
  temperature: 0.7
};

const flow = DynamicFlowEngine.createFlow(schema, config);
```

### Using the Schema Builder Component

```tsx
import { DynamicSchemaBuilder } from '@/components/ui/dynamic-schema-builder';

function MyApp() {
  const handleSave = (schema: SchemaDefinition) => {
    console.log('Schema saved:', schema);
    // Save to database or local storage
  };

  return (
    <DynamicSchemaBuilder
      onSave={handleSave}
      onTest={(schema) => console.log('Testing schema:', schema)}
    />
  );
}
```

### Testing Flows

```tsx
import { AIFlowTester } from '@/components/ui/ai-flow-tester';

function TestingInterface({ schema }: { schema: SchemaDefinition }) {
  return (
    <AIFlowTester
      schema={schema}
      onConfigChange={(config) => console.log('Config updated:', config)}
    />
  );
}
```

## 🔧 Field Types & Validation

### Supported Field Types

| Type | Description | Validation Options |
|------|-------------|-------------------|
| `string` | Text input | min/max length, pattern, enum |
| `number` | Numeric input | min/max value |
| `boolean` | True/false | - |
| `email` | Email address | Built-in email validation |
| `url` | Website URL | Built-in URL validation |
| `date` | Date picker | - |
| `array` | JSON array | - |
| `object` | JSON object | - |

### Validation Rules

```typescript
const field: SchemaField = {
  name: 'username',
  type: 'string',
  validation: {
    min: 3,
    max: 20,
    pattern: '^[a-zA-Z0-9_]+$',
    enum: ['admin', 'user', 'guest']
  }
};
```

## 🚀 Getting Started

### Installation

1. Copy all files to your project
2. Install dependencies:
```bash
npm install zod lucide-react
```

### Basic Setup

1. Import and use the schema builder:
```tsx
import { DynamicSchemaBuilder } from '@/components/ui/dynamic-schema-builder';

export default function SchemaPage() {
  return <DynamicSchemaBuilder />;
}
```

2. Start building schemas visually!

### Integration with AI Flows

```typescript
// Create a schema
const schema = {
  id: 'my-schema',
  name: 'Chat Flow',
  input: {
    fields: [
      {
        name: 'message',
        type: 'string',
        required: true
      }
    ]
  },
  output: {
    fields: [
      {
        name: 'response', 
        type: 'string',
        required: true
      }
    ]
  }
};

// Create the flow
const flow = DynamicFlowEngine.createFlow(schema, {
  name: 'chatFlow',
  model: 'googleai/gemini-2.5-flash-lite',
  temperature: 0.7
});

// Execute with data
const result = await DynamicFlowEngine.executeFlow('my-schema', {
  message: 'Hello, how are you?'
});
```

## 🎨 UI Features

### Schema Builder Interface
- **Visual Field Editor**: Add, edit, and configure fields with a rich UI
- **Real-time Preview**: See how your schema will look and behave
- **Code Generation**: View generated TypeScript and Zod code
- **Validation Feedback**: Immediate validation with helpful error messages

### Flow Tester Interface  
- **Dynamic Forms**: Auto-generated forms based on your schema
- **Real-time Testing**: Execute flows and see results immediately
- **History Tracking**: View previous executions and results
- **Configuration Panel**: Adjust AI model settings

## 📊 Advanced Features

### Custom Validation
Add custom validation functions:
```typescript
const field: SchemaField = {
  name: 'password',
  type: 'string', 
  validation: {
    custom: {
      validator: '(value) => value.length >= 8 && /[A-Z]/.test(value)',
      message: 'Password must be at least 8 characters with uppercase letter'
    }
  }
};
```

### Schema Templates
Create reusable schema templates:
```typescript
const chatSchemaTemplate = {
  input: [
    { name: 'userMessage', type: 'string', required: true },
    { name: 'systemPrompt', type: 'string', required: false }
  ],
  output: [
    { name: 'response', type: 'string', required: true }
  ]
};
```

### Batch Operations
Process multiple schemas:
```typescript
const schemas = DynamicFlowEngine.listFlows();
schemas.forEach(schema => {
  DynamicFlowEngine.executeFlow(schema.id, testData);
});
```

## 🔍 Debugging & Troubleshooting

### Common Issues

1. **Invalid Field Names**: Ensure field names are valid JavaScript identifiers
2. **Validation Errors**: Check the validation panel for detailed error messages  
3. **Flow Execution**: Verify schema is valid before creating flows

### Debug Mode
Enable detailed logging:
```typescript
DynamicFlowEngine.enableDebugMode(true);
```

## 🤝 Contributing

This system is designed to be extensible. You can:

1. Add new field types in `types.ts`
2. Extend validation rules in `schema-converter.ts`
3. Create custom UI components
4. Add new AI model integrations

## 📄 License

This project is part of the Arkan AI platform. See the main project documentation for license details.

---

## 🚀 Quick Start Example

```tsx
import { DynamicSchemaBuilder, AIFlowTester } from '@/components/ui';
import { DynamicFlowEngine } from '@/ai/core';

export default function MyAIApp() {
  const [currentSchema, setCurrentSchema] = useState(null);

  return (
    <div className="container mx-auto p-6">
      <h1>My AI Schema Builder</h1>
      
      <DynamicSchemaBuilder
        onSchemaChange={setCurrentSchema}
        onSave={(schema) => {
          localStorage.setItem('schemas', JSON.stringify(schema));
          DynamicFlowEngine.createFlow(schema, {
            name: schema.name,
            model: 'googleai/gemini-2.5-flash-lite',
            temperature: 0.7
          });
        }}
      />
      
      {currentSchema && (
        <AIFlowTester schema={currentSchema} />
      )}
    </div>
  );
}
```

Start building powerful AI flows with visual schemas today! 🎉