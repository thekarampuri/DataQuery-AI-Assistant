import { DataSchema } from './api';
import Papa from 'papaparse';

interface CSVParseResult {
  data: any[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

interface TypeInferenceResult {
  type: string;
  confidence: number;
}

// Helper function to infer data type from a value
const inferType = (value: any): TypeInferenceResult => {
  if (value === null || value === undefined || value === '') {
    return { type: 'string', confidence: 0.5 };
  }

  // Try parsing as number
  if (!isNaN(value) && !isNaN(parseFloat(value))) {
    return { type: 'number', confidence: 0.9 };
  }

  // Try parsing as boolean
  const booleanValues = ['true', 'false', '1', '0'];
  if (booleanValues.includes(value.toString().toLowerCase())) {
    return { type: 'boolean', confidence: 0.8 };
  }

  // Try parsing as datetime
  const dateValue = new Date(value);
  if (!isNaN(dateValue.getTime())) {
    return { type: 'datetime', confidence: 0.7 };
  }

  // Default to string
  return { type: 'string', confidence: 1.0 };
};

// Helper function to determine the most common type
const getMostCommonType = (types: TypeInferenceResult[]): string => {
  const typeScores: Record<string, number> = {};
  
  types.forEach(result => {
    typeScores[result.type] = (typeScores[result.type] || 0) + result.confidence;
  });

  return Object.entries(typeScores)
    .sort(([, a], [, b]) => b - a)[0][0];
};

// Process CSV file and generate schema
export const processCSV = async (file: File): Promise<{ schema: DataSchema; data: any[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results: CSVParseResult) => {
        try {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }

          const data = results.data;
          if (data.length === 0) {
            throw new Error('CSV file is empty');
          }

          // Infer column types
          const columns = Object.keys(data[0]).map(columnName => {
            const columnValues = data.map(row => row[columnName]);
            const typeResults = columnValues.map(value => inferType(value));
            const inferredType = getMostCommonType(typeResults);

            return {
              name: columnName,
              type: inferredType
            };
          });

          // Generate schema
          const schema: DataSchema = {
            tableName: file.name.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9_]/g, '_'),
            columns
          };

          resolve({ schema, data });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Papa.ParseError) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
};