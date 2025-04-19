import * as XLSX from 'xlsx';

interface ParsedData {
  jsonData: any[];
  schema: {
    tableName: string;
    columns: Array<{
      name: string;
      type: string;
    }>;
  };
}

/**
 * Parses a CSV file and converts it to JSON format
 * @param file - The CSV file to parse
 * @returns Promise containing the parsed JSON data and schema
 */
export const parseCSVToJSON = async (file: File): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];
        
        if (jsonData.length === 0) {
          throw new Error('The file appears to be empty');
        }

        // Create schema from first row
        const firstRow = jsonData[0];
        const columns = Object.keys(firstRow).map(key => ({
          name: key,
          type: detectColumnType(firstRow[key])
        }));

        const schema = {
          tableName: file.name.split('.')[0],
          columns
        };

        resolve({
          jsonData,
          schema
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Detects the type of a column based on its value
 * @param value - The value to analyze
 * @returns The detected type ('string', 'number', 'boolean', or 'datetime')
 */
const detectColumnType = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'string';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (value instanceof Date) {
    return 'datetime';
  }

  // Check if it's a date string
  const date = new Date(value as string);
  if (!isNaN(date.getTime())) {
    return 'datetime';
  }

  return 'string';
}; 