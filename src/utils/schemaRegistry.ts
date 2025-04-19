import { DataSchema } from './api';

interface SchemaRegistryEntry {
  schema: DataSchema;
  createdAt: Date;
  lastUpdated: Date;
  rowCount: number;
}

class SchemaRegistry {
  private static instance: SchemaRegistry;
  private registry: Map<string, SchemaRegistryEntry>;

  private constructor() {
    this.registry = new Map();
  }

  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  public registerSchema(schema: DataSchema, rowCount: number): void {
    const entry: SchemaRegistryEntry = {
      schema,
      createdAt: new Date(),
      lastUpdated: new Date(),
      rowCount
    };
    this.registry.set(schema.tableName, entry);
  }

  public getSchema(tableName: string): SchemaRegistryEntry | undefined {
    return this.registry.get(tableName);
  }

  public updateSchema(schema: DataSchema, rowCount: number): void {
    const existing = this.registry.get(schema.tableName);
    if (existing) {
      existing.schema = schema;
      existing.lastUpdated = new Date();
      existing.rowCount = rowCount;
      this.registry.set(schema.tableName, existing);
    }
  }

  public listSchemas(): SchemaRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  public removeSchema(tableName: string): boolean {
    return this.registry.delete(tableName);
  }

  public hasSchema(tableName: string): boolean {
    return this.registry.has(tableName);
  }
}

export const schemaRegistry = SchemaRegistry.getInstance();