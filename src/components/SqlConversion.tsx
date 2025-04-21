import React, { useState } from 'react';
import { Database, Copy, Check } from 'lucide-react';
import { DataSchema } from '../utils/api';

type SqlType = 'MySQL';

interface SqlConversionProps {
  darkMode: boolean;
  schema: DataSchema | null;
  data: any[];
}

const convertExcelToSQL = (tableName: string, schema: DataSchema, data: any[], sqlType: SqlType): string => {
  // Helper function to get SQL type based on database type
  const getSqlType = (colType: string, type: SqlType): string => {
    if (colType === 'number') {
      const hasDecimal = data.some(row => {
        const val = row[colType];
        return val && Number(val) % 1 !== 0;
      });
      
      return hasDecimal ? 'DECIMAL(10,2)' : 'INT';
    }
    
    if (colType === 'boolean') {
      return 'TINYINT(1)';
    }
    
    if (colType === 'datetime') {
      return 'DATETIME';
    }
    
    return 'VARCHAR(255)';
  };

  // Get the correct identifier quotes based on SQL type
  const quote = sqlType === 'MySQL' ? '`' : '"';

  // Create table query
  const createTableQuery = `CREATE TABLE ${sqlType === 'MySQL' ? 'IF NOT EXISTS ' : ''}${quote}${tableName}${quote} (\n` +
    schema.columns.map(col => {
      const colSqlType = getSqlType(col.type, sqlType);
      return `  ${quote}${col.name}${quote} ${colSqlType}`;
    }).join(',\n') +
    '\n);\n\n';

  // Insert queries
  const insertQueries = data.map(row => {
    const columns = schema.columns.map(col => `${quote}${col.name}${quote}`).join(', ');
    const values = schema.columns.map(col => {
      const value = row[col.name];
      if (value === null || value === undefined) return 'NULL';
      if (col.type === 'number') return value;
      if (col.type === 'boolean') {
        if (sqlType === 'MySQL') return value ? '1' : '0';
        return value ? 'TRUE' : 'FALSE';
      }
      if (col.type === 'datetime') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'NULL' : `'${date.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
      return `'${String(value).replace(/'/g, "''")}'`;
    }).join(', ');
    return `INSERT INTO ${quote}${tableName}${quote} (${columns}) VALUES (${values});`;
  }).join('\n');

  // Return only create and insert queries
  return `${createTableQuery}${insertQueries}\n`;
};

const SqlConversion: React.FC<SqlConversionProps> = ({ darkMode, schema, data }) => {
  const [customTableName, setCustomTableName] = useState<string>('');
  const [selectedSqlType] = useState<SqlType>('MySQL');
  const [sqlQueries, setSqlQueries] = useState<string>('');
  const [showSqlQueries, setShowSqlQueries] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  const handleConvertToSQL = () => {
    if (!schema || !data.length || !customTableName.trim()) return;
    
    const tableName = customTableName.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const queries = convertExcelToSQL(tableName, schema, data, selectedSqlType);
    setSqlQueries(queries);
    setShowSqlQueries(true);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[120px] sm:mt-[80px]">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            SQL Conversion
          </h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Table Name
              </label>
              <input
                type="text"
                value={customTableName}
                onChange={(e) => setCustomTableName(e.target.value)}
                placeholder="Enter table name"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-700'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                SQL Type
              </label>
              <div className={`w-full px-3 py-2 rounded-lg border text-sm ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}>
                MySQL
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleConvertToSQL}
              disabled={!schema || !data.length || !customTableName.trim()}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg ${
                darkMode
                  ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600'
                  : 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
            >
              <Database className="h-4 w-4 mr-2" />
              Generate SQL
            </button>
          </div>

          {showSqlQueries && sqlQueries && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <pre className={`whitespace-pre-wrap font-mono text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {sqlQueries}
                  </pre>
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => copyToClipboard(sqlQueries)}
                    className={`p-1.5 rounded-full transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-600' 
                        : 'hover:bg-gray-200'
                    }`}
                    title="Copy SQL"
                  >
                    {copiedSQL ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <a
                  href="https://www.programiz.com/sql/online-compiler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg ${
                    darkMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <span>Open SQL Online Compiler</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SqlConversion; 