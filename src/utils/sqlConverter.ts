import { DataSchema } from './api';

// Function to format column name with underscores
const formatColumnName = (columnName: string): string => {
  // Replace spaces with underscores
  let formatted = columnName.replace(/\s+/g, '_');
  
  // Add underscore between camelCase words
  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1_$2');
  
  // Convert to lowercase
  return formatted.toLowerCase();
};

// Function to get SQL data type
const getSqlDataType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'number':
      return 'DECIMAL(18,2)';
    case 'integer':
      return 'INT';
    case 'date':
    case 'datetime':
      return 'DATETIME';
    case 'boolean':
      return 'BOOLEAN';
    default:
      return 'VARCHAR(255)';
  }
};

// Function to format value based on its type
const formatValue = (value: any, type: string): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  switch (type.toLowerCase()) {
    case 'number':
    case 'integer':
      return value.toString();
    case 'date':
    case 'datetime':
      return `'${new Date(value).toISOString().slice(0, 19).replace('T', ' ')}'`;
    case 'boolean':
      return value ? '1' : '0';
    default:
      return `'${value.toString().replace(/'/g, "''")}'`;
  }
};

// Generate CREATE TABLE query
export const generateCreateTableQuery = (tableName: string, schema: DataSchema): string => {
  const formattedTableName = formatColumnName(tableName);
  
  const columnDefinitions = schema.columns.map(column => {
    const formattedColumnName = formatColumnName(column.name);
    const sqlType = getSqlDataType(column.type);
    return `  ${formattedColumnName} ${sqlType}`;
  }).join(',\n');

  return `CREATE TABLE ${formattedTableName} (\n${columnDefinitions}\n);`;
};

// Generate INSERT queries
export const generateInsertQueries = (
  tableName: string,
  schema: DataSchema,
  data: any[],
  batchSize: number = 100
): string[] => {
  const formattedTableName = formatColumnName(tableName);
  const columnNames = schema.columns.map(column => formatColumnName(column.name));
  
  const queries: string[] = [];
  
  // Process data in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const values = batch.map(row => {
      const rowValues = schema.columns.map(column => 
        formatValue(row[column.name], column.type)
      );
      return `(${rowValues.join(', ')})`;
    }).join(',\n  ');

    const query = `INSERT INTO ${formattedTableName} (${columnNames.join(', ')})\nVALUES\n  ${values};`;
    queries.push(query);
  }

  return queries;
};

// Generate complete SQL script
export const generateCompleteScript = (
  tableName: string,
  schema: DataSchema,
  data: any[]
): string => {
  const createTable = generateCreateTableQuery(tableName, schema);
  const insertQueries = generateInsertQueries(tableName, schema, data);
  
  return [
    '-- Create Table',
    createTable,
    '',
    '-- Insert Data',
    ...insertQueries
  ].join('\n\n');
}; 