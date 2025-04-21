import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Database, ExternalLink } from 'lucide-react';
import { DataSchema } from '../utils/api';
import { generateCompleteScript, generateCreateTableQuery, generateInsertQueries } from '../utils/sqlConverter';

interface SqlConversionProps {
  darkMode: boolean;
  schema: DataSchema | null;
  data: any[];
}

const SqlConversion: React.FC<SqlConversionProps> = ({ darkMode, schema, data }) => {
  const [tableName, setTableName] = useState('');
  const [sqlScript, setSqlScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [scriptType, setScriptType] = useState<'complete' | 'create' | 'insert'>('complete');

  useEffect(() => {
    if (schema && data.length > 0) {
      generateSql();
    }
  }, [schema, data, tableName, scriptType]);

  const generateSql = () => {
    if (!schema || !tableName) return;

    let script = '';
    switch (scriptType) {
      case 'create':
        script = generateCreateTableQuery(tableName, schema);
        break;
      case 'insert':
        script = generateInsertQueries(tableName, schema, data).join('\n\n');
        break;
      default:
        script = generateCompleteScript(tableName, schema, data);
    }
    setSqlScript(script);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadScript = () => {
    const blob = new Blob([sqlScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_${scriptType}_script.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!schema) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[120px] sm:mt-[80px]">
        <div className={`rounded-xl shadow-sm border p-6 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
          <div className="flex items-center justify-center space-x-3">
            <Database className={`h-6 w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <p>Please upload a file to generate SQL queries.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[120px] sm:mt-[80px]">
      <div className={`rounded-xl shadow-sm border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center space-x-3 mb-6">
          <Database className={`h-6 w-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            SQL Query Generator
          </h2>
        </div>

        <div className="space-y-6">
          {/* Table Name Input */}
          <div className="max-w-xl">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Table Name
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
            />
          </div>

          {/* Script Type Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Script Type
            </label>
            <div className="flex flex-wrap gap-3">
              {(['complete', 'create', 'insert'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setScriptType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scriptType === type
                      ? darkMode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* SQL Script Output */}
          {sqlScript ? (
            <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`flex items-center justify-between px-4 py-2 border-b ${
                darkMode ? 'bg-gray-700 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <Database className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Generated SQL
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className={`p-1.5 rounded-lg transition-colors ${
                      darkMode
                        ? 'hover:bg-gray-600 text-gray-300'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    title={copied ? 'Copied!' : 'Copy to clipboard'}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={downloadScript}
                    className={`p-1.5 rounded-lg transition-colors ${
                      darkMode
                        ? 'hover:bg-gray-600 text-gray-300'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    title="Download SQL script"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <pre
                className={`p-4 overflow-x-auto text-sm ${
                  darkMode
                    ? 'bg-gray-900 text-gray-300'
                    : 'bg-gray-50 text-gray-800'
                }`}
                style={{ maxHeight: '500px' }}
              >
                {sqlScript}
              </pre>
            </div>
          ) : (
            <div className={`rounded-lg p-8 text-center border-2 border-dashed ${
              darkMode 
                ? 'border-gray-700 bg-gray-900/50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <Database className={`h-8 w-8 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Enter a table name to generate SQL queries
              </p>
            </div>
          )}

          {/* Online SQL Editor Link */}
          <div className="flex justify-center mt-6">
            <a
              href="https://www.programiz.com/sql/online-compiler/"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open SQL Online Editor
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SqlConversion; 