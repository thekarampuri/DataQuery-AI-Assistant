import React, { useState, useRef, useEffect } from 'react';
import { Upload, Database, FileSpreadsheet, PieChart, Download, Send, Table, ChevronLeft, ChevronRight, Moon, Sun, Copy, Check, BarChart, LineChart, Mic, MicOff, Volume1, Volume2, Book, Home, User, LogIn } from 'lucide-react';
import * as XLSX from 'xlsx';
import ChartComponent from './components/ChartComponent';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { analyzeData, DataSchema } from './utils/api';
import DataVisualization from './components/DataVisualization';
import Education from './components/Education';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import { analyzeDataWithAI } from './utils/gemini';
import { parseCSVToJSON } from './utils/csvParser';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import { useAuth } from './hooks/useAuth';
import { auth } from './config/firebase';
import { signOut } from 'firebase/auth';

// Add these types before the App function
type SqlType = 'MySQL';

// Update jsPDF interface
declare module 'jspdf' {
  interface GState {
    opacity?: number;
  }

  interface jsPDF {
    internal: {
      events: PubSub;
      scaleFactor: number;
      pageSize: {
        width: number;
        getWidth: () => number;
        height: number;
        getHeight: () => number;
      };
      pages: number[];
      getEncryptor(objectId: number): (data: string) => string;
    };
    setGState: (gState: any) => jsPDF;
    GState: (parameters: GState) => GState;
    rect: (x: number, y: number, w: number, h: number, style?: string | null | undefined) => jsPDF;
    setLineWidth: (width: number) => jsPDF;
    setDrawColor: {
      (ch1: string): jsPDF;
      (ch1: number): jsPDF;
      (ch1: number, ch2: number, ch3: number, ch4?: number): jsPDF;
    };
    setFillColor: {
      (ch1: string): jsPDF;
      (ch1: number, ch2: number, ch3: number, ch4?: number): jsPDF;
    };
  }

  interface PubSub {
    subscribe(event: string, callback: Function): void;
    unsubscribe(event: string, callback: Function): void;
    publish(event: string, data?: any): void;
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const BAR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
const LINE_COLOR = '#8884d8';

interface ColumnType {
  name: string;
  type: string;
}

// Add type definitions for Speech Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// Define QueryResult interface locally to avoid conflict
interface QueryResult {
  answer: string;
  sqlQuery: string;
  needsChart: boolean;
  chartType: string | null;
  chartData?: Array<{ name: string; value: number }>;
  chartDataColumn?: string;
  executionTime?: number;
  confidence?: number;
}

// Add a function to format the natural language response
const formatNLResponse = (question: string, data: any[], schema: DataSchema): string => {
  // Format based on question type
  if (question.toLowerCase().includes('how many')) {
    const total = data.length;
    return `Based on the dataset, there are ${total.toLocaleString()} records.`;
  }
  
  if (question.toLowerCase().includes('average') || question.toLowerCase().includes('mean')) {
    // Handle average calculations
    return `The average value is...`; // Complete this based on actual calculation
  }
  
  // Add more question type handlers
  return "I've analyzed the data and here's what I found...";
};

// Add the formatSQLQuery function before the App function
function formatSQLQuery(query: string): string {
  // Capitalize SQL keywords
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 
    'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 
    'LIMIT', 'OFFSET', 'AND', 'OR', 'IN', 'NOT IN', 
    'EXISTS', 'NOT EXISTS', 'UNION', 'INTERSECT', 'EXCEPT',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT'
  ];
  
  let formattedQuery = query.trim();
  
  // Capitalize keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formattedQuery = formattedQuery.replace(regex, keyword);
  });
  
  // Add proper indentation
  formattedQuery = formattedQuery
    .replace(/\bFROM\b/g, '\n  FROM')
    .replace(/\bWHERE\b/g, '\n  WHERE')
    .replace(/\bGROUP BY\b/g, '\n  GROUP BY')
    .replace(/\bORDER BY\b/g, '\n  ORDER BY')
    .replace(/\bHAVING\b/g, '\n  HAVING')
    .replace(/\bLIMIT\b/g, '\n  LIMIT')
    .replace(/\bJOIN\b/g, '\n  JOIN')
    .replace(/\bAND\b/g, '\n    AND')
    .replace(/\bOR\b/g, '\n    OR');
  
  return formattedQuery;
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

function App() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [query, setQuery] = useState('');
  const [schema, setSchema] = useState<DataSchema | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [copiedRow, setCopiedRow] = useState<number | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const rowsPerPage = 10;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [excelFormula, setExcelFormula] = useState<string>('');
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [sqlQueries, setSqlQueries] = useState<string>('');
  const [showSqlQueries, setShowSqlQueries] = useState(false);
  const [customTableName, setCustomTableName] = useState<string>('');
  const [selectedSqlType, setSelectedSqlType] = useState<SqlType>('MySQL');
  const [showEducation, setShowEducation] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const { t, language } = useLanguage();
  const { user, loading, isAuthenticated: authIsAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLanding(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      
      // Chrome requires this event for voice loading
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
      
      // Initial load attempt
      loadVoices();
    }

    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setQuery(transcript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }

    // Cleanup
    return () => {
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };
  }, []);

  const copyRowToClipboard = async (row: any, rowIndex: number) => {
    const text = Object.entries(row)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedRow(rowIndex);
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const detectColumnType = (value: any): string => {
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'datetime';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  };

  const updateChartData = (columnName: string) => {
    if (!data || !schema) return;

    const column = schema.columns.find(col => col.name === columnName);
    if (!column) return;

    let transformedData: Array<{ name: string; value: number }>;
    if (column.type === 'number') {
      // For numeric columns, show the distribution of values
      transformedData = data.map((row, index) => {
        const value = row[columnName];
        return {
          name: `Row ${index + 1}`,
          value: typeof value === 'number' ? value : parseFloat(value?.toString() || '0')
        };
      });
    } else {
      // For non-numeric columns, count occurrences of each value
      const valueCounts = data.reduce((acc, row) => {
        const value = row[columnName]?.toString() || 'Unknown';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      transformedData = Object.entries(valueCounts).map(([value, count]) => ({
        name: value,
        value: Number(count)
      }));
    }

    // Create a new QueryResult with the updated chart data
    const newQueryResult: QueryResult = {
      answer: 'Data loaded successfully',
      sqlQuery: '',
      needsChart: true,
      chartType: chartType,
      chartData: transformedData,
      chartDataColumn: columnName
    };

    setQueryResult(newQueryResult);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzing(true);

    try {
      const { jsonData, schema } = await parseCSVToJSON(file);
      setSchema(schema);
      setData(jsonData);
      setCurrentPage(1);
      
      // Set initial selected column and chart data
      if (schema.columns.length > 0) {
        setSelectedColumn(schema.columns[0].name);
        updateChartData(schema.columns[0].name);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      // Handle error appropriately
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeQuery = async (query: string): Promise<QueryResult> => {
    if (!schema || !data.length) {
      throw new Error("Please upload data first");
    }
    
    try {
      const result = await analyzeData(query, schema, data);
      return result;
    } catch (error) {
      console.error('Error analyzing query:', error);
      throw error;
    }
  };

  const copyToClipboard = async (text: string, type: 'message' | 'sql', index?: number) => {
    await navigator.clipboard.writeText(text);
    if (type === 'message' && index !== undefined) {
      setCopiedMessage(index);
      setTimeout(() => setCopiedMessage(null), 2000);
    } else if (type === 'sql') {
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2000);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.length || !query.trim() || isAnalyzing) return;

    const newMessage = { role: 'user' as const, content: query };
    setConversation(prev => [...prev, newMessage]);
    setIsAnalyzing(true);

    try {
      // Handle greeting messages directly without calling LLM
      const greetings = ['hi', 'hello', 'hey', 'greetings'];
      if (greetings.includes(query.toLowerCase().trim())) {
        const greetingResponse = {
          role: 'assistant' as const,
          content: "Hello! I'm your data analysis assistant. You can ask me questions about your data, and I'll help you analyze it. For example, try asking about specific columns, averages, trends, or distributions in your data."
        };
        setConversation(prev => [...prev, greetingResponse]);
        setQueryResult({
          answer: greetingResponse.content,
          sqlQuery: '',
          needsChart: false,
          chartType: null,
          chartDataColumn: ''
        });
        
        setQuery('');
        setIsAnalyzing(false);
        return;
      }

      // First get LLM response
      const result = await analyzeDataWithAI(query, schema, data);
      
      // Add assistant's response to conversation
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: result.answer
      }]);

      // Update query result with both LLM response and visualization data
      setQueryResult({
        ...result,
        answer: result.answer,
        sqlQuery: result.sqlQuery,
        chartType: result.chartType
      });

      // Generate Excel formula based on the query
      let excelFormula = '';
      if (queryResult?.sqlQuery) {
        const sqlLower = queryResult.sqlQuery.toLowerCase();
        if (sqlLower.includes('count')) {
          excelFormula = `=COUNTIF(Sheet1!A:A, "criteria")`;
        } else if (sqlLower.includes('avg') || sqlLower.includes('average')) {
          excelFormula = `=AVERAGE(Sheet1!A:A)`;
        } else if (sqlLower.includes('sum')) {
          excelFormula = `=SUM(Sheet1!A:A)`;
        } else if (sqlLower.includes('max')) {
          excelFormula = `=MAX(Sheet1!A:A)`;
        } else if (sqlLower.includes('min')) {
          excelFormula = `=MIN(Sheet1!A:A)`;
        }
      }
      setExcelFormula(excelFormula);

      setQuery('');
    } catch (error) {
      console.error('Query analysis failed:', error);
      
      const errorMessage = error instanceof Error 
        ? `I apologize, but I encountered an error while processing your query: ${error.message}`
        : 'I apologize, but something went wrong. Could you please rephrase your question?';

      setConversation(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);

      setQueryResult({
        answer: errorMessage,
        sqlQuery: '',
        needsChart: false,
        chartType: null,
        chartDataColumn: ''
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update generatePDF function
  const generatePDF = async () => {
    if (!resultsRef.current) return;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    }) as any;

    // Add decorative header
    pdf.setFillColor(66, 102, 241);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 40, 'F');

    // Add logo-like design
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text(t('dataQueryAI'), 20, 25);

    // Add subtitle
    pdf.setFontSize(14);
    pdf.text(t('analyzeData'), 20, 35);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    let yOffset = 50;

    // Add decorative line
    pdf.setDrawColor(66, 102, 241);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yOffset, pageWidth - margin, yOffset);
    yOffset += 10;

    // Add date and time with proper localization
    const now = new Date();
    const dateStr = now.toLocaleDateString(language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'mr-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.text(`${t('generated')}: ${dateStr}`, margin, yOffset);
    yOffset += 15;

    // Helper function to draw section box with improved design
    const drawSectionBox = (startY: number, height: number, title: string) => {
      pdf.setDrawColor(66, 102, 241);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, startY, contentWidth, height, 'S');
      
      // Add section title background
      pdf.setFillColor(240, 242, 255);
      pdf.rect(margin, startY, contentWidth, 12, 'F');
      
      // Add section title
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(66, 102, 241);
      pdf.setFontSize(14);
      pdf.text(title, margin + 5, startY + 9);
      
      // Reset styles
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
    };

    // Add conversation history section
    const conversationHeight = Math.min(conversation.length * 15 + 20, pageHeight / 2);
    drawSectionBox(yOffset, conversationHeight, t('conversationHistory'));
    yOffset += 20;
    
    conversation.forEach((message) => {
      const role = message.role === 'user' ? t('user') : t('assistant');
      const content = message.content;
      
      if (yOffset + 20 > pageHeight - margin) {
        // Add page number before creating new page
        pdf.setFontSize(10);
        pdf.text(`${pdf.internal.getNumberOfPages()}`, pageWidth - 25, pageHeight - 10);
        
        pdf.addPage();
        // Add header to new page
        pdf.setFillColor(66, 102, 241);
        pdf.rect(0, 0, pageWidth, 20, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.text(t('dataQueryAI'), 20, 13);
        
        yOffset = 40;
      }

      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(`${role}: ${content}`, contentWidth - 10);
      pdf.text(lines, margin + 5, yOffset + 10);
      yOffset += (lines.length * 5) + 5;
    });

    yOffset += 10;

    // Add Results section
    if (queryResult?.sqlQuery) {
      if (yOffset + 60 > pageHeight - margin) {
        pdf.addPage();
        yOffset = margin;
      }

      const resultsHeight = 50;
      drawSectionBox(yOffset, resultsHeight, t('results'));
      yOffset += 20;
      
      pdf.setFontSize(10);
      const queryLines = pdf.splitTextToSize(queryResult.sqlQuery, contentWidth - 10);
      pdf.text(queryLines, margin + 5, yOffset + 10);
      yOffset += (queryLines.length * 5) + 10;
    }

    // Add Visualization section with improved design
    if (queryResult?.needsChart || selectedColumn) {
      if (yOffset + 180 > pageHeight - margin) {
        pdf.addPage();
        yOffset = margin;
      }

      const chartDataRows = queryResult?.chartData ? Math.ceil(queryResult.chartData.length / 3) : 0;
      const chartDataHeight = chartDataRows * 4 + 10;
      const visualizationHeight = 160 + chartDataHeight;

      drawSectionBox(yOffset, visualizationHeight, t('dataVisualize'));
      yOffset += 20;

      const chartContainer = document.querySelector('.w-full.h-\\[400px\\]') as HTMLElement;
      if (chartContainer) {
        try {
          // Wait for chart animations to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          const originalStyle = chartContainer.style.cssText;
          chartContainer.style.height = '400px';
          chartContainer.style.width = '100%';
          chartContainer.style.backgroundColor = '#FFFFFF';

          const canvas = await html2canvas(chartContainer, {
            backgroundColor: '#FFFFFF',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
          });

          chartContainer.style.cssText = originalStyle;

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth * 0.9;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          const xOffset = margin + (contentWidth - imgWidth) / 2;
          pdf.addImage(imgData, 'PNG', xOffset, yOffset + 5, imgWidth, imgHeight);
          yOffset += imgHeight + 15;

          // Add chart data labels in a grid layout
          if (queryResult?.chartData) {
            pdf.setFontSize(8);
            const labelWidth = Math.floor(contentWidth / 3);
            const labelHeight = 4;
            
            queryResult.chartData.forEach((item, index) => {
              const column = index % 3;
              const row = Math.floor(index / 3);
              const x = margin + 5 + (column * labelWidth);
              const y = yOffset + (row * labelHeight);
              
              const label = `${item.name}: ${item.value}`;
              pdf.text(label, x, y);
            });
          }
        } catch (error) {
          console.error('Error capturing chart:', error);
        }
      }
    }

    // Add page numbers to all pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${t('page')} ${i} ${t('of')} ${totalPages}`, pageWidth - 50, pageHeight - 10);
    }

    pdf.save(`data-query-report-${language}-${new Date().getTime()}.pdf`);
  };

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const renderChart = () => {
    if (!queryResult?.chartData || !queryResult.chartData.length) {
      return (
        <div className={`h-64 flex items-center justify-center border-2 border-dashed rounded-lg ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
          <div className="text-center space-y-2">
            {chartType === 'pie' && <PieChart className={`h-8 w-8 mx-auto ${darkMode ? 'text-gray-600' : 'text-indigo-400'}`} />}
            {chartType === 'bar' && <BarChart className={`h-8 w-8 mx-auto ${darkMode ? 'text-gray-600' : 'text-indigo-400'}`} />}
            {chartType === 'line' && <LineChart className={`h-8 w-8 mx-auto ${darkMode ? 'text-gray-600' : 'text-indigo-400'}`} />}
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('noDataToVisualize')}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-[400px]" ref={chartRef}>
        <ChartComponent
          data={queryResult.chartData}
          chartType={chartType}
          darkMode={darkMode}
        />
      </div>
    );
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      // Submit the query when stopping voice input
      if (query.trim()) {
        handleQuerySubmit(new Event('submit') as any);
      }
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        alert('Failed to start speech recognition. Please try again.');
      }
    }
  };

  const handleChartTypeChange = (type: 'pie' | 'bar' | 'line') => {
    setChartType(type);
    if (queryResult) {
      // Preserve all existing query result data while updating only the chart type
      setQueryResult(prev => ({
        ...prev!,
        chartType: type,
        // Ensure these properties are preserved
        answer: prev!.answer,
        sqlQuery: prev!.sqlQuery,
        needsChart: prev!.needsChart,
        chartData: prev!.chartData,
        chartDataColumn: prev!.chartDataColumn,
        executionTime: prev!.executionTime,
        confidence: prev!.confidence
      }));
    }
  };

  // Load and set the preferred voice
  const loadVoices = () => {
    if (!speechSynthesis) return;
    
    const voices = speechSynthesis.getVoices();
    // Try to find a female English voice for a more professional sound
    const preferredVoice = voices.find(
      voice => 
        (voice.name.includes('Samantha') || // macOS female voice
         voice.name.includes('Google UK English Female') || // Chrome female voice
         voice.name.includes('Microsoft Zira')) && // Windows female voice
        voice.lang.startsWith('en')
    ) || voices.find(voice => voice.lang.startsWith('en')); // Fallback to any English voice
    
    if (preferredVoice) {
      setSelectedVoice(preferredVoice);
    }
  };

  // Update the speak function to handle multiple messages
  const speak = (text: string, messageIndex: number) => {
    if (!speechSynthesis) return;

    // If already speaking, stop current speech
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice properties for a more professional sound
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };
    
    setIsSpeaking(true);
    setSpeakingMessageIndex(messageIndex);
    speechSynthesis.speak(utterance);
  };

  // Update handleConvertToSQL
  const handleConvertToSQL = () => {
    if (!schema || !data.length || !customTableName.trim()) return;
    
    const tableName = customTableName.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const queries = convertExcelToSQL(tableName, schema, data, selectedSqlType);
    setSqlQueries(queries);
    setShowSqlQueries(true);
  };

  // Handle guest access
  const handleGuestAccess = () => {
    setShowLandingPage(false);
  };

  // Add sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowLandingPage(true);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show landing page if not authenticated
  if (!loading && !authIsAuthenticated && showLandingPage) {
    return <LandingPage darkMode={darkMode} onGuestAccess={handleGuestAccess} />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} shadow-lg border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className={`h-8 w-8 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('dataQueryAI')}
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('analyzeData')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector darkMode={darkMode} />
              {user && (
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-600'
                }`}>
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.displayName || user.email}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEducation(false)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                    darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <Home className="h-4 w-4 mr-2" />
                  {t('home')}
                </button>
                <button
                  onClick={() => setShowEducation(!showEducation)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                    darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <Book className="h-4 w-4 mr-2" />
                  {t('learn')}
                </button>
                {authIsAuthenticated && (
                  <button
                    onClick={handleSignOut}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                      darkMode
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    {t('signOut')}
                  </button>
                )}
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-600'} hover:opacity-80`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showEducation ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Education darkMode={darkMode} />
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* File Upload */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-0`}>
                    Data Input
                  </h2>
                  {uploadedFile && (
                    <span className={`text-sm flex items-center px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      {uploadedFile.name}
                    </span>
                  )}
                </div>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-indigo-200 hover:bg-indigo-50'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`h-8 w-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-indigo-400'}`} />
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-indigo-600'}`}>
                      Upload your Excel or CSV file
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      Drag and drop or click to browse
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Schema and Data Preview */}
              {schema && (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-6`}>
                  <div className="flex items-center space-x-2 mb-4">
                    <Table className={`h-5 w-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Data Schema & Preview
                    </h2>
                  </div>
                  
                  {/* Schema Table */}
                  <div className="mb-6">
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-2`}>
                      {t('columnDefinitions')}
                    </h3>
                    <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4`}>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                {t('column')}
                              </th>
                              <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                {t('type')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {schema.columns.map((column, index) => (
                              <tr key={index} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}>
                                <td className={`px-4 py-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {column.name}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    darkMode 
                                      ? 'bg-indigo-900 text-indigo-200' 
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}>
                                    {column.type}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Data Preview */}
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-2`}>
                      {t('dataPreview')}
                    </h3>
                    <div className={`overflow-x-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4`}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider w-10`}>
                              {t('actions')}
                            </th>
                            {schema.columns.map((column, index) => (
                              <th
                                key={index}
                                className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}
                              >
                                {column.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {paginatedData.map((row, rowIndex) => (
                            <tr key={rowIndex} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}>
                              <td className={`px-4 py-2 text-sm whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                <button
                                  onClick={() => copyRowToClipboard(row, rowIndex)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    darkMode 
                                      ? 'hover:bg-gray-700 focus:bg-gray-700' 
                                      : 'hover:bg-gray-200 focus:bg-gray-200'
                                  }`}
                                  title={t('copyRowData')}
                                >
                                  {copiedRow === rowIndex ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                  )}
                                </button>
                              </td>
                              {schema.columns.map((column, colIndex) => (
                                <td
                                  key={colIndex}
                                  className={`px-4 py-2 text-sm whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
                                >
                                  {row[column.name]?.toString()}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                              darkMode
                                ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            } disabled:opacity-50`}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t('previous')}
                          </button>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="1"
                              max={totalPages}
                              value={currentPage}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= 1 && value <= totalPages) {
                                  setCurrentPage(value);
                                }
                              }}
                              className={`w-16 px-2 py-1 text-sm border rounded-md ${
                                darkMode
                                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                                  : 'bg-white border-gray-300 text-gray-700'
                              } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                            />
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {t('page')} {currentPage} {t('of')} {totalPages}
                            </span>
                          </div>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                              darkMode
                                ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            } disabled:opacity-50`}
                          >
                            {t('next')}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Query Input */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-4 sm:p-6`}>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  {t('conversationHistory')}
                </h2>
                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                  {conversation.map((message, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg relative ${
                        message.role === 'user'
                          ? darkMode
                            ? 'bg-gray-700 ml-8'
                            : 'bg-indigo-50 ml-8'
                          : darkMode
                            ? 'bg-gray-900 mr-8'
                            : 'bg-gray-50 mr-8'
                      }`}
                    >
                      <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} pr-16`}>
                        {message.content}
                      </p>
                      <div className="absolute top-2 right-2 flex items-center space-x-1">
                        <button
                          onClick={() => speak(message.content, index)}
                          className={`p-1.5 rounded-full transition-colors ${
                            darkMode 
                              ? 'hover:bg-gray-600' 
                              : 'hover:bg-gray-200'
                          }`}
                          title={isSpeaking && speakingMessageIndex === index ? t('stopSpeaking') : t('listenMessage')}
                        >
                          {isSpeaking && speakingMessageIndex === index ? (
                            <Volume2 className={`h-4 w-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Volume1 className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(message.content, 'message', index)}
                          className={`p-1.5 rounded-full transition-colors ${
                            darkMode 
                              ? 'hover:bg-gray-600' 
                              : 'hover:bg-gray-200'
                          }`}
                          title={t('copyMessage')}
                        >
                          {copiedMessage === index ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <form onSubmit={handleQuerySubmit}>
                  <div className="relative">
                    <textarea
                      className={`w-full h-32 px-4 py-3 rounded-xl resize-none ${
                        darkMode
                          ? 'bg-gray-900 text-gray-200 border-gray-600'
                          : 'text-gray-700 border-indigo-200'
                      } border focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      placeholder={t('queryPlaceholder')}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (query.trim() && !isAnalyzing) {
                            handleQuerySubmit(e);
                          }
                        }
                      }}
                      disabled={isAnalyzing}
                    />
                    <div className="absolute bottom-3 right-3 flex space-x-2">
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`p-2 rounded-lg transition-colors ${
                          isListening
                            ? darkMode
                              ? 'bg-red-600 text-white'
                              : 'bg-red-600 text-white'
                            : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isListening ? t('stopVoice') : t('startVoice')}
                        disabled={!recognition}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                      <button
                        type="submit"
                        disabled={isAnalyzing || !query.trim()}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm ${
                          darkMode
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {t('analyzing')}
                          </span>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {t('query')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Data Visualization */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-4 sm:p-6 mt-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-0`}>
                    {t('dataVisualize')}
                  </h2>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleChartTypeChange('pie')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-medium ${
                        chartType === 'pie'
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <PieChart className="h-4 w-4 inline-block mr-1" />
                      {t('pieChart')}
                    </button>
                    <button
                      onClick={() => handleChartTypeChange('bar')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-medium ${
                        chartType === 'bar'
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <BarChart className="h-4 w-4 inline-block mr-1" />
                      {t('barChart')}
                    </button>
                    <button
                      onClick={() => handleChartTypeChange('line')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-medium ${
                        chartType === 'line'
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <LineChart className="h-4 w-4 inline-block mr-1" />
                      {t('lineChart')}
                    </button>
                  </div>
                </div>

                {/* Column Selector */}
                {schema && schema.columns.length > 0 && (
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('selectColumnToVisualize')}
                    </label>
                    <select
                      value={selectedColumn}
                      onChange={(e) => {
                        setSelectedColumn(e.target.value);
                        updateChartData(e.target.value);
                      }}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-700'
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    >
                      {schema.columns.map((column) => (
                        <option key={column.name} value={column.name}>
                          {column.name} ({column.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Render the chart based on selected type */}
                {renderChart()}
              </div>

              {/* Results */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Results
                  </h2>
                  {queryResult && (
                    <div className="space-x-2">
                      <button
                        onClick={generatePDF}
                        className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg ${
                          darkMode
                            ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600'
                            : 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </button>
                    </div>
                  )}
                </div>
                
                <div ref={resultsRef}>
                  {queryResult ? (
                    <div className="space-y-4">
                      {/* SQL Query Section */}
                      {queryResult.sqlQuery && (
                        <div className={`p-4 rounded-lg border relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
                          <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            SQL Query
                          </h3>
                          <pre className={`whitespace-pre-wrap font-mono text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {queryResult.sqlQuery}
                          </pre>
                          <button
                            onClick={() => copyToClipboard(queryResult.sqlQuery, 'sql')}
                            className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                              darkMode 
                                ? 'hover:bg-gray-600' 
                                : 'hover:bg-gray-200'
                            }`}
                            title={t('copySql')}
                          >
                            {copiedSQL ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Excel Formula Section */}
                      {excelFormula && (
                        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
                          <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Excel Formula
                          </h3>
                          <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                            {excelFormula}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                      <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('noResults')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SQL Conversion */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-6 mt-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    SQL Conversion
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('tableName')}
                      </label>
                      <input
                        type="text"
                        value={customTableName}
                        onChange={(e) => setCustomTableName(e.target.value)}
                        placeholder={t('enterTableName')}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-200'
                            : 'bg-white border-gray-300 text-gray-700'
                        } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('sqlType')}
                      </label>
                      <div className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}>
                        MySQL
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
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
                      {t('generateSql')}
                    </button>
                  </div>

                  {showSqlQueries && sqlQueries && (
                    <div className="space-y-4 mt-4">
                      <div className={`p-4 rounded-lg border relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          <pre className={`whitespace-pre-wrap font-mono text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {sqlQueries}
                          </pre>
                        </div>
                        <div className="absolute top-2 right-2 space-x-2">
                          <button
                            onClick={() => copyToClipboard(sqlQueries, 'sql')}
                            className={`p-1.5 rounded-full transition-colors ${
                              darkMode 
                                ? 'hover:bg-gray-600' 
                                : 'hover:bg-gray-200'
                            }`}
                            title={t('copySql')}
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
                          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                            darkMode
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                          <span>{t('openSqlOnlineCompiler')}</span>
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
          </div>
        </main>
      )}
    </div>
  );
}

export default App;