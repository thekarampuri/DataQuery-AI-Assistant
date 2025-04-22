import React, { useState, useRef, useEffect } from 'react';
import { Upload, Database, FileSpreadsheet, PieChart, Download, Send, Table, ChevronLeft, ChevronRight, Moon, Sun, Copy, Check, BarChart, LineChart, Mic, MicOff, Volume1, Volume2, Book, Home, User, LogOut, Code, Clock, PlusCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import ChartComponent from './components/ChartComponent';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { analyzeData, DataSchema } from './utils/api';
import DataVisualization from './components/DataVisualization';
import Education from './components/Education';
import SqlConversion from './components/SqlConversion';
import { analyzeDataWithAI } from './utils/gemini';
import { parseCSVToJSON } from './utils/csvParser';
import { useAuth } from './hooks/useAuth';
import { auth } from './config/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import HistorySidebar from './components/HistorySidebar';
import { QueryResult, HistorySession, ConversationMessage } from './types/history';
import * as historyService from './services/historyService';
import { createUserDocument } from './services/historyService';

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
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedExcel, setCopiedExcel] = useState(false);
  const [excelFormula, setExcelFormula] = useState<string>('');
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [showEducation, setShowEducation] = useState(false);
  const [showSqlConversion, setShowSqlConversion] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Load user's sessions
  useEffect(() => {
    const loadSessions = async () => {
      if (user) {
        try {
          const userSessions = await historyService.getUserSessions(user.uid);
          setSessions(userSessions);
        } catch (error) {
          console.error('Error loading sessions:', error);
        }
      }
    };

    loadSessions();
  }, [user]);

  // Create new session when file is uploaded
  useEffect(() => {
    const createNewSession = async () => {
      if (user && uploadedFile && schema && !currentSessionId) {
        try {
          // Only update the current session if it exists
          if (currentSessionId) {
            await historyService.updateSession(
              user.uid,
              currentSessionId,
              conversation,
              queryResult ? [queryResult] : []
            );
          }
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }
    };

    if (uploadedFile && schema && user) {
      createNewSession();
    }
  }, [uploadedFile, schema, user, currentSessionId]);

  // Update session when conversation changes
  useEffect(() => {
    const updateCurrentSession = async () => {
      if (user && currentSessionId && queryResult) {
        try {
          const timestampedConversation = conversation.map(msg => ({
            ...msg,
            timestamp: new Date()
          }));

          const timestampedQueries = queryResult ? [{
            ...queryResult,
            timestamp: new Date()
          }] : [];

          await historyService.updateSession(
            user.uid,
            currentSessionId,
            timestampedConversation,
            timestampedQueries,
            data // Pass the current data to keep it in sync
          );
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }
    };

    if (conversation.length > 0) {
      updateCurrentSession();
    }
  }, [conversation, queryResult, currentSessionId, user, data]);

  // Check authentication on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoading(false);
      if (!user) {
        navigate('/login');
      } else {
        // Create/update user document in Firestore
        await createUserDocument(user.uid, {
          name: user.displayName,
          email: user.email
        });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Update the conversation state initialization in useEffect
  useEffect(() => {
    if (user && currentSessionId) {
      const loadSession = async () => {
        try {
          const session = await historyService.getSession(user.uid, currentSessionId);
          if (session) {
            setConversation(session.conversation);
            setQueryResult(session.queries[session.queries.length - 1] || null);
          }
        } catch (error) {
          console.error('Error loading session:', error);
        }
      };
      loadSession();
    }
  }, [user, currentSessionId]);

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
      transformedData = data.map((row, index) => {
        const value = row[columnName];
        return {
          name: `Row ${index + 1}`,
          value: typeof value === 'number' ? value : parseFloat(value?.toString() || '0')
        };
      });
    } else {
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
      chartDataColumn: columnName,
      excelFormula: '',
      timestamp: new Date() // Add timestamp
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
      
      // Create new session when file is uploaded
      if (user) {
        try {
          console.log('Creating new session with file:', file.name);
          const sessionId = await historyService.createSession(user.uid, {
            name: file.name,
            uploadDate: new Date(),
            schema: schema,
            data: jsonData, // Store the complete data
            previewData: jsonData.slice(0, 10),
            totalRows: jsonData.length,
            fileType: file.type,
            fileSize: file.size
          });
          console.log('Session created with ID:', sessionId);
          setCurrentSessionId(sessionId);
          
          // Refresh sessions list
          const userSessions = await historyService.getUserSessions(user.uid);
          setSessions(userSessions);

          // Set initial conversation
          const initialMessage: ConversationMessage = {
            role: 'assistant',
            content: `File "${file.name}" loaded successfully with ${jsonData.length} records.`,
            timestamp: new Date()
          };
          setConversation([initialMessage]);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
      
      // Set initial selected column and chart data
      if (schema.columns.length > 0) {
        setSelectedColumn(schema.columns[0].name);
        updateChartData(schema.columns[0].name);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
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
      return {
        ...result,
        timestamp: new Date() // Ensure timestamp is set
      };
    } catch (error) {
      console.error('Error analyzing query:', error);
      throw error;
    }
  };

  const copyToClipboard = async (text: string | undefined, type: 'message' | 'sql' | 'excel', index?: number) => {
    if (!text) return;
    
    await navigator.clipboard.writeText(text);
    if (type === 'message' && index !== undefined) {
      setCopiedMessage(index);
      setTimeout(() => setCopiedMessage(null), 2000);
    } else if (type === 'sql') {
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2000);
    } else if (type === 'excel') {
      setCopiedExcel(true);
      setTimeout(() => setCopiedExcel(false), 2000);
    }
  };

  // Add this helper function to properly capitalize names
  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const generateSqlQuery = (question: string, tableName: string, schema: DataSchema): string | null => {
    const q = question.toLowerCase();
    
    // Check if it's a visualization-only query
    const isVisualizationQuery = (q.includes('display') || q.includes('show') || q.includes('visualize')) &&
      (q.includes('first') || q.includes('top') || q.includes('chart') || q.includes('graph'));
    
    if (isVisualizationQuery) {
      return null;
    }

    // Helper to get column name regardless of case
    const getColumnName = (searchName: string): string | undefined => {
      return schema.columns.find(col => 
        col.name.toLowerCase() === searchName.toLowerCase()
      )?.name;
    };

    // Extract name and capitalize it properly
    const extractName = (q: string): string => {
      // Look for name patterns in questions about country, age, gender, etc.
      const nameMatch = q.match(/of\s+(\w+)/i) || q.match(/for\s+(\w+)/i) || 
                       q.match(/=\s*['"]?(\w+)['"]?/i) || q.match(/is\s+(\w+)/i);
      return nameMatch ? capitalizeFirstLetter(nameMatch[1]) : '';
    };

    // Country queries
    if (q.includes('country')) {
      const name = extractName(q);
      const countryCol = getColumnName('country') || 'Country';
      const nameCol = getColumnName('first_name') || getColumnName('name') || 'First_Name';
      if (name) {
        return `SELECT ${countryCol}\nFROM ${tableName}\nWHERE ${nameCol} = '${name}';`;
      }
      return `SELECT ${countryCol}, COUNT(*) as count\nFROM ${tableName}\nGROUP BY ${countryCol};`;
    }

    // Gender queries
    if (q.includes('gender') || q.includes('sex')) {
      const name = extractName(q);
      const genderCol = getColumnName('gender') || 'Gender';
      const nameCol = getColumnName('first_name') || getColumnName('name') || 'First_Name';
      if (name) {
        return `SELECT ${genderCol}\nFROM ${tableName}\nWHERE ${nameCol} = '${name}';`;
      }
      return `SELECT ${genderCol}, COUNT(*) as count\nFROM ${tableName}\nGROUP BY ${genderCol};`;
    }

    // Age queries
    if (q.includes('age')) {
      const name = extractName(q);
      const ageCol = getColumnName('age') || 'Age';
      const nameCol = getColumnName('first_name') || getColumnName('name') || 'First_Name';
      if (name) {
        return `SELECT ${ageCol}\nFROM ${tableName}\nWHERE ${nameCol} = '${name}';`;
      }
      if (q.includes('average')) {
        return `SELECT AVG(${ageCol}) as average_age\nFROM ${tableName};`;
      }
      return `SELECT ${ageCol}, COUNT(*) as count\nFROM ${tableName}\nGROUP BY ${ageCol}\nORDER BY ${ageCol};`;
    }

    // Count queries
    if (q.includes('how many')) {
      if (q.includes('gender') || q.includes('sex')) {
        const genderCol = getColumnName('gender') || 'Gender';
        return `SELECT ${genderCol}, COUNT(*) as count\nFROM ${tableName}\nGROUP BY ${genderCol};`;
      }
      return `SELECT COUNT(*) as total\nFROM ${tableName};`;
    }

    // Name queries
    if (q.includes('name')) {
      const nameCol = getColumnName('first_name') || getColumnName('name') || 'First_Name';
      if (q.includes('start')) {
        const letter = q.match(/start\s+with\s+(\w)/i)?.[1] || '';
        return `SELECT ${nameCol}\nFROM ${tableName}\nWHERE ${nameCol} LIKE '${letter.toUpperCase()}%';`;
      }
      return `SELECT ${nameCol}\nFROM ${tableName}\nORDER BY ${nameCol};`;
    }

    // Details queries
    if (q.includes('details')) {
      const name = extractName(q);
      const nameCol = getColumnName('first_name') || getColumnName('name') || 'First_Name';
      if (name) {
        return `SELECT *\nFROM ${tableName}\nWHERE ${nameCol} = '${name}';`;
      }
      return `SELECT *\nFROM ${tableName};`;
    }

    // Direct name = value queries
    const directNameMatch = q.match(/where\s+\w+\s*=\s*['"]?(\w+)['"]?/i);
    if (directNameMatch) {
      const name = capitalizeFirstLetter(directNameMatch[1]);
      const nameCol = getColumnName('first_name') || getColumnName('name') || 'First_Name';
      const requestedCol = q.match(/select\s+(\w+)/i)?.[1];
      const col = requestedCol ? getColumnName(requestedCol) || requestedCol : '*';
      return `SELECT ${col}\nFROM ${tableName}\nWHERE ${nameCol} = '${name}';`;
    }

    // List all query
    if (q.includes('list all') || q.includes('show all')) {
      return `SELECT *\nFROM ${tableName};`;
    }

    // Default to a general query if no specific pattern is matched
    return `SELECT *\nFROM ${tableName}\nLIMIT 10;`;
  };

  const generateExcelFormula = (question: string, schema: DataSchema): string | null => {
    const q = question.toLowerCase();
    
    // Check if it's a visualization-only query
    const isVisualizationQuery = (q.includes('display') || q.includes('show') || q.includes('visualize')) &&
      (q.includes('first') || q.includes('top') || q.includes('chart') || q.includes('graph'));
    
    if (isVisualizationQuery) {
      return null;
    }

    // Helper to get column letter
    const getColumnLetter = (colName: string): string => {
      const colIndex = schema.columns.findIndex(col => 
        col.name.toLowerCase() === colName.toLowerCase()
      );
      return colIndex >= 0 ? String.fromCharCode(65 + colIndex) : 'A';
    };

    // Extract name and capitalize it properly
    const extractName = (q: string): string => {
      const nameMatch = q.match(/of\s+(\w+)/i) || q.match(/for\s+(\w+)/i) || 
                       q.match(/=\s*['"]?(\w+)['"]?/i) || q.match(/is\s+(\w+)/i);
      return nameMatch ? capitalizeFirstLetter(nameMatch[1]) : '';
    };

    // Country queries
    if (q.includes('country')) {
      const name = extractName(q);
      const countryCol = getColumnLetter(schema.columns.find(col => 
        col.name.toLowerCase() === 'country'
      )?.name || 'Country');
      const nameCol = getColumnLetter(schema.columns.find(col => 
        col.name.toLowerCase() === 'first_name' || col.name.toLowerCase() === 'name'
      )?.name || 'First_Name');
      
      if (name) {
        return `=VLOOKUP("${name}", ${nameCol}:${countryCol}, ${countryCol.charCodeAt(0) - nameCol.charCodeAt(0) + 1}, FALSE)`;
      }
      return `=UNIQUE(${countryCol}:${countryCol})`;
    }

    // Gender queries
    if (q.includes('gender') || q.includes('sex')) {
      const name = extractName(q);
      const genderCol = getColumnLetter(schema.columns.find(col => 
        col.name.toLowerCase() === 'gender'
      )?.name || 'Gender');
      const nameCol = getColumnLetter(schema.columns.find(col => 
        col.name.toLowerCase() === 'first_name' || col.name.toLowerCase() === 'name'
      )?.name || 'First_Name');
      
      if (name) {
        return `=VLOOKUP("${name}", ${nameCol}:${genderCol}, ${genderCol.charCodeAt(0) - nameCol.charCodeAt(0) + 1}, FALSE)`;
      }
      return `=COUNTIFS(${genderCol}:${genderCol}, {"Male", "Female"})`;
    }

    // Age queries
    if (q.includes('age')) {
      const name = extractName(q);
      const ageCol = getColumnLetter(schema.columns.find(col => 
        col.name.toLowerCase() === 'age'
      )?.name || 'Age');
      const nameCol = getColumnLetter(schema.columns.find(col => 
        col.name.toLowerCase() === 'first_name' || col.name.toLowerCase() === 'name'
      )?.name || 'First_Name');
      
      if (name) {
        return `=VLOOKUP("${name}", ${nameCol}:${ageCol}, ${ageCol.charCodeAt(0) - nameCol.charCodeAt(0) + 1}, FALSE)`;
      }
      if (q.includes('average')) {
        return `=AVERAGE(${ageCol}:${ageCol})`;
      }
      return `=FREQUENCY(${ageCol}:${ageCol}, ${ageCol}:${ageCol})`;
    }

    // Direct column lookup queries
    const directNameMatch = q.match(/where\s+\w+\s*=\s*['"]?(\w+)['"]?/i);
    if (directNameMatch) {
      const name = capitalizeFirstLetter(directNameMatch[1]);
      const requestedCol = q.match(/select\s+(\w+)/i)?.[1];
      if (requestedCol) {
        const targetCol = getColumnLetter(requestedCol);
        const nameCol = getColumnLetter(schema.columns.find(col => 
          col.name.toLowerCase() === 'first_name' || col.name.toLowerCase() === 'name'
        )?.name || 'First_Name');
        return `=VLOOKUP("${name}", ${nameCol}:${targetCol}, ${targetCol.charCodeAt(0) - nameCol.charCodeAt(0) + 1}, FALSE)`;
      }
    }

    // Default formula
    return `=FILTER(A:Z, A:A<>"")`;
  };

  const generateComparisonData = (question: string, data: any[]): { chartData: any[], chartType: 'bar' | 'pie' | 'line' | null, chartTitle: string, chartSubtitle: string } | null => {
    const q = question.toLowerCase();
    
    // Extract the attribute being compared (e.g., salary, age)
    let attribute = '';
    if (q.includes('salary') || q.includes('salaries')) attribute = 'Salary';
    else if (q.includes('age') || q.includes('ages')) attribute = 'Age';
    else if (q.includes('gender')) attribute = 'Gender';
    else if (q.includes('country')) attribute = 'Country';
    else if (q.includes('id')) attribute = 'ID';

    // Check for different types of comparison queries
    const isComparisonQuery = q.includes('comparison') || q.includes('compare') || 
                             q.includes('vs') || q.includes('versus') || 
                             q.includes('show') || q.includes('display') ||
                             q.includes('first') || q.includes('top') ||
                             (q.includes('and') && attribute);

    if (isComparisonQuery && attribute) {
      let comparisonData: any[] = [];

      // Handle specific row-based queries
      const rowMatch = q.match(/first\s+(\d+)|top\s+(\d+)|(\d+)\s+(?:rows|people|entries)/i);
      const numRows = rowMatch ? parseInt(rowMatch[1] || rowMatch[2] || rowMatch[3]) : 5;

      if (q.includes('first') || q.includes('top') || 
          q.includes('rows') || q.includes('people') || q.includes('entries')) {
        comparisonData = data.slice(0, numRows).map(row => ({
          name: row.First_Name || row.Name,
          value: typeof row[attribute] === 'number' ? row[attribute] : 0
        }));
      } 
      // Handle name-based comparisons
      else {
        // Extract names being compared - handle both full names and first names
        const allNames = data.map(row => ({
          fullName: row.First_Name || row.Name,
          firstName: (row.First_Name || row.Name).split(' ')[0]
        }));

        // Find mentioned names in the question
        const mentionedNames = allNames.filter(nameObj => 
          q.toLowerCase().includes(nameObj.fullName.toLowerCase()) || 
          q.toLowerCase().includes(nameObj.firstName.toLowerCase())
        );

        // Get unique names (in case of duplicates)
        const uniqueNames = Array.from(new Set(mentionedNames.map(n => n.fullName)));

        if (uniqueNames.length >= 2) {
          comparisonData = data.filter(row => 
            uniqueNames.includes(row.First_Name || row.Name)
          ).map(row => ({
            name: row.First_Name || row.Name,
            value: typeof row[attribute] === 'number' ? row[attribute] : 0
          }));
        }
      }

      if (comparisonData.length > 0) {  // Changed from >= 2 to > 0 to handle single row cases
        // Sort data by value for better visualization
        comparisonData.sort((a, b) => b.value - a.value);

        // Format values based on attribute type
        const formattedData = comparisonData.map(item => ({
          ...item,
          displayValue: attribute === 'Salary' 
            ? `$${item.value.toLocaleString()}`
            : item.value.toString()
        }));

        let subtitle = '';
        if (q.includes('first') || q.includes('top') || 
            q.includes('rows') || q.includes('people') || q.includes('entries')) {
          subtitle = `Showing ${formattedData.length} entries`;
        } else {
          subtitle = `Comparing ${formattedData.map(d => d.name).join(' and ')}`;
        }

        return {
          chartData: formattedData,
          chartType: 'bar',
          chartTitle: `${attribute} ${formattedData.length > 1 ? 'Comparison' : 'Display'}`,
          chartSubtitle: subtitle
        };
      }
    }

    return null;
  };

  const formatResponse = (answer: string, data: any[]): string => {
    // Remove asterisks and format the response
    let formattedAnswer = answer.replace(/\*\*/g, '');

    // Split into sentences
    const sentences = formattedAnswer.split(/(?<=[.!?])\s+/);
    
    // Group related information
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];

    sentences.forEach((sentence) => {
      if (sentence.toLowerCase().includes('according to') || 
          sentence.toLowerCase().includes('in short') ||
          sentence.toLowerCase().includes('is there anything') ||
          sentence.toLowerCase().startsWith('would you')) {
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        currentParagraph.push(sentence);
      } else {
        currentParagraph.push(sentence);
      }
    });

    // Add any remaining sentences
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }

    // Join paragraphs with double line breaks
    return paragraphs.join('\n\n');
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.length || !query.trim() || isAnalyzing || !uploadedFile || !schema) return;

    const newMessage: ConversationMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    const updatedConversation = [...conversation, newMessage];
    setConversation(updatedConversation);
    setIsAnalyzing(true);

    try {
      // Get table name from uploaded file
      const tableName = uploadedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase();

      // First check if this is a comparison or display query that needs a chart
      const comparisonData = generateComparisonData(query, data);
      
      // Then get LLM response
      const result = await analyzeDataWithAI(query, schema, data);
      
      // Format the response
      const formattedAnswer = formatResponse(result.answer, data);
      
      // Add assistant's response to conversation
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: formattedAnswer,
        timestamp: new Date()
      };

      const finalConversation = [...updatedConversation, assistantMessage];
      setConversation(finalConversation);

      // Generate SQL query and Excel formula
      const sqlQuery = generateSqlQuery(query, tableName, schema);
      const excelFormula = generateExcelFormula(query, schema);

      // Create query result with timestamp
      const queryResult: QueryResult = {
        answer: formattedAnswer,
        sqlQuery: sqlQuery || 'This type of visualization query does not generate a SQL query.',
        needsChart: comparisonData !== null,
        chartType: (comparisonData?.chartType || result.chartType || 'bar') as 'pie' | 'bar' | 'line' | null,
        chartData: comparisonData?.chartData || result.chartData,
        chartTitle: comparisonData?.chartTitle || result.chartTitle,
        chartSubtitle: comparisonData?.chartSubtitle || result.chartSubtitle,
        chartDataColumn: result.chartDataColumn || '',
        excelFormula: excelFormula || 'This type of visualization query does not generate an Excel formula.',
        timestamp: new Date()
      };

      // Update query result state
      setQueryResult(queryResult);

      // Save to Firestore if we have a session
      if (user && currentSessionId) {
        try {
          await historyService.updateSession(
            user.uid,
            currentSessionId,
            finalConversation,
            [queryResult],
            data // Pass the current data to keep it in sync
          );
          
          // Refresh sessions list
          const userSessions = await historyService.getUserSessions(user.uid);
          setSessions(userSessions);
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }

      setQuery('');
    } catch (error) {
      console.error('Query analysis failed:', error);
      
      const errorMessage = error instanceof Error 
        ? `I apologize, but I encountered an error while processing your query: ${error.message}`
        : 'I apologize, but something went wrong. Could you please rephrase your question?';

      const errorAssistantMessage: ConversationMessage = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };

      const finalConversation = [...updatedConversation, errorAssistantMessage];
      setConversation(finalConversation);

      setQueryResult({
        answer: errorMessage,
        sqlQuery: '',
        needsChart: false,
        chartType: null,
        chartDataColumn: '',
        excelFormula: '',
        timestamp: new Date()
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
    pdf.text('DataQuery AI', 20, 25);

    // Add subtitle
    pdf.setFontSize(14);
    pdf.text('Analyze and Visualize Your Data', 20, 35);
    
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

    // Add date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${dateStr}`, margin, yOffset);
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
    drawSectionBox(yOffset, conversationHeight, 'Conversation History');
    yOffset += 20;
    
    conversation.forEach((message) => {
      const role = message.role === 'user' ? 'User' : 'Assistant';
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
        pdf.text('DataQuery AI', 20, 13);
        
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
      drawSectionBox(yOffset, resultsHeight, 'Results');
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

      drawSectionBox(yOffset, visualizationHeight, 'Data Visualization');
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
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 50, pageHeight - 10);
    }

    pdf.save('data-query-report.pdf');
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
              No data to visualize
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
          chartTitle={queryResult.chartTitle}
          chartSubtitle={queryResult.chartSubtitle}
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
      setQueryResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          chartType: type
        };
      });
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

  // Add sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSelectSession = async (session: HistorySession) => {
    setUploadedFile(null);
    setSchema(session.file.schema);
    setData(session.file.data); // Load the complete data
    setConversation(session.conversation);
    setQueryResult(session.queries[session.queries.length - 1] || null);
    setCurrentSessionId(session.id);
    setIsHistorySidebarOpen(false);
    
    // Set initial selected column and chart data if available
    if (session.file.schema.columns.length > 0) {
      setSelectedColumn(session.file.schema.columns[0].name);
      updateChartData(session.file.schema.columns[0].name);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      await historyService.deleteSession(user.uid, sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setUploadedFile(null);
        setSchema(null);
        setConversation([]);
        setQueryResult(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleNewChat = async () => {
    if (user && currentSessionId && conversation.length > 0) {
      try {
        await historyService.updateSession(
          user.uid,
          currentSessionId,
          conversation,
          queryResult ? [queryResult] : []
        );
      } catch (error) {
        console.error('Error saving current session:', error);
      }
    }

    setUploadedFile(null);
    setSchema(null);
    setData([]);
    setQuery('');
    setConversation([]);
    setQueryResult(null);
    setCurrentSessionId(null);
    setCurrentPage(1);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
      }`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show login redirect message if not authenticated
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
      }`}>
        <div className="text-center">
          <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Please log in to continue
          </p>
          <button
            onClick={() => navigate('/login')}
            className={`mt-4 px-6 py-2 rounded-lg ${
              darkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} shadow-lg border-b fixed top-0 left-0 right-0 z-[1000]`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Database className={`h-6 w-6 sm:h-8 sm:w-8 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  DataQuery AI Assistant
                </h1>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Analyze and Visualize Your Data
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(user) && (
                <div className={`flex items-center space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm ${
                  darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-600'
                }`}>
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-medium truncate max-w-[120px] sm:max-w-none">
                    {user?.displayName || user?.email}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {queryResult && (
                <button
                    onClick={generatePDF}
                    className={`flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                      darkMode
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Export PDF
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowEducation(false);
                    setShowSqlConversion(false);
                  }}
                  className={`flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                    darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Home
                </button>
                <button
                  onClick={() => {
                    setShowEducation(!showEducation);
                    setShowSqlConversion(false);
                  }}
                  className={`flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                    darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <Book className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Learn
                </button>
                <button
                  onClick={() => {
                    setShowSqlConversion(!showSqlConversion);
                    setShowEducation(false);
                  }}
                  className={`flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                    darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <Code className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  SQL
                </button>
                <button
                  onClick={handleSignOut}
                  className={`p-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-1 sm:p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-600'} hover:opacity-80`}
                >
                  {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
                    className={`p-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    title="History"
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Add History Sidebar */}
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        toggleSidebar={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        darkMode={darkMode}
      />

      {showEducation ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[120px] sm:mt-[80px]">
          <Education darkMode={darkMode} />
        </div>
      ) : showSqlConversion ? (
        <SqlConversion darkMode={darkMode} schema={schema} data={data} />
      ) : (
        <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-8 mt-[120px] sm:mt-[80px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-8">
            {/* Left Column */}
            <div className="space-y-2 sm:space-y-6">
              {/* File Upload */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-3 sm:p-6 mt-4 sm:mt-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4">
                  <h2 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-0`}>
                    Data Input
                  </h2>
                  {uploadedFile && (
                    <span className={`text-xs sm:text-sm flex items-center px-2 sm:px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {uploadedFile.name}
                    </span>
                  )}
                </div>
                <label className={`flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-indigo-200 hover:bg-indigo-50'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-4 sm:pt-5 pb-4 sm:pb-6">
                    <Upload className={`h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 ${darkMode ? 'text-gray-400' : 'text-indigo-400'}`} />
                    <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-indigo-600'}`}>
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
                      Column Definitions
                    </h3>
                    <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4`}>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Column
                              </th>
                              <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Type
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
                      Data Preview
                    </h3>
                    <div className={`overflow-x-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4`}>
                      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="sticky top-0 z-10 bg-inherit">
                          <tr>
                              <th className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider w-10 bg-inherit`}>
                              Actions
                            </th>
                            {schema.columns.map((column, index) => (
                              <th
                                key={index}
                                  className={`px-4 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider bg-inherit`}
                              >
                                {column.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}>
                              <td className={`px-4 py-2 text-sm whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                <button
                                  onClick={() => copyRowToClipboard(row, rowIndex)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    darkMode 
                                      ? 'hover:bg-gray-700 focus:bg-gray-700' 
                                      : 'hover:bg-gray-200 focus:bg-gray-200'
                                  }`}
                                  title="Copy Row Data"
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
                          </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Query Input and Conversation History */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-3 sm:p-6 mt-4 sm:mt-6`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Conversation History
                  </h2>
                  {conversation.length > 0 && (
                    <button
                      onClick={() => {
                        setConversation([]);
                        setQueryResult(null);
                      }}
                      className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                        darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title="Clear"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4 max-h-60 overflow-y-auto">
                  {conversation.map((message, index) => (
                    <div
                      key={index}
                      className={`p-2 sm:p-4 rounded-lg relative ${
                        message.role === 'user'
                          ? darkMode
                            ? 'bg-gray-700 ml-4 sm:ml-8'
                            : 'bg-indigo-50 ml-4 sm:ml-8'
                          : darkMode
                            ? 'bg-gray-900 mr-4 sm:mr-8'
                            : 'bg-gray-50 mr-4 sm:mr-8'
                      }`}
                    >
                      <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} pr-12 text-sm sm:text-base`}>
                        {message.content}
                      </p>
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex items-center space-x-1">
                        <button
                          onClick={() => speak(message.content, index)}
                          className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                            darkMode 
                              ? 'hover:bg-gray-600' 
                              : 'hover:bg-gray-200'
                          }`}
                          title={isSpeaking && speakingMessageIndex === index ? 'Stop Speaking' : 'Listen Message'}
                        >
                          {isSpeaking && speakingMessageIndex === index ? (
                            <Volume2 className={`h-3 w-3 sm:h-4 sm:w-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Volume1 className={`h-3 w-3 sm:h-4 sm:w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(message.content, 'message', index)}
                          className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                            darkMode 
                              ? 'hover:bg-gray-600' 
                              : 'hover:bg-gray-200'
                          }`}
                          title="Copy Message"
                        >
                          {copiedMessage === index ? (
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                          ) : (
                            <Copy className={`h-3 w-3 sm:h-4 sm:w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleQuerySubmit}>
                  <div className="relative">
                    <textarea
                      className={`w-full h-24 sm:h-32 px-3 sm:px-4 py-2 sm:py-3 rounded-xl resize-none text-sm sm:text-base ${
                        darkMode
                          ? 'bg-gray-900 text-gray-200 border-gray-600'
                          : 'text-gray-700 border-indigo-200'
                      } border focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      placeholder="Type your query here..."
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
                    <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex space-x-2">
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                          isListening
                            ? darkMode
                              ? 'bg-red-600 text-white'
                              : 'bg-red-600 text-white'
                            : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isListening ? 'Stop Voice' : 'Start Voice'}
                        disabled={!recognition}
                      >
                        {isListening ? <MicOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </button>
                      <button
                        type="submit"
                        disabled={isAnalyzing || !query.trim()}
                        className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg shadow-sm ${
                          darkMode
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Analyzing...
                          </span>
                        ) : (
                          <>
                            <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Query
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Results */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-3 sm:p-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4">
                  <h2 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Results
                  </h2>
                </div>
                
                <div ref={resultsRef}>
                  {queryResult ? (
                    <div className="space-y-3 sm:space-y-4">
                      {/* SQL Query Section */}
                      {queryResult.sqlQuery && (
                        <div className={`p-3 sm:p-4 rounded-lg border relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
                          <h3 className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            SQL Query
                          </h3>
                          <pre className={`whitespace-pre-wrap font-mono text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {queryResult.sqlQuery}
                          </pre>
                          <button
                            onClick={() => copyToClipboard(queryResult.sqlQuery, 'sql')}
                            className={`absolute top-1 sm:top-2 right-1 sm:right-2 p-1 sm:p-1.5 rounded-full transition-colors ${
                              darkMode 
                                ? 'hover:bg-gray-600' 
                                : 'hover:bg-gray-200'
                            }`}
                            title="Copy SQL"
                          >
                            {copiedSQL ? (
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            ) : (
                              <Copy className={`h-3 w-3 sm:h-4 sm:w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Excel Formula Section */}
                      {queryResult.excelFormula && (
                        <div className={`p-3 sm:p-4 rounded-lg border relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
                          <h3 className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Excel Formula
                          </h3>
                          <p className={`text-xs sm:text-sm font-mono ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {queryResult.excelFormula}
                          </p>
                          <button
                            onClick={() => queryResult?.excelFormula && copyToClipboard(queryResult.excelFormula, 'excel')}
                            className={`absolute top-1 sm:top-2 right-1 sm:right-2 p-1 sm:p-1.5 rounded-full transition-colors ${
                              darkMode 
                                ? 'hover:bg-gray-600' 
                                : 'hover:bg-gray-200'
                            }`}
                            title="Copy Excel Formula"
                          >
                            {copiedExcel ? (
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            ) : (
                              <Copy className={`h-3 w-3 sm:h-4 sm:w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-3 sm:p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                      <p className={`text-center text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No results found
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Visualization */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} rounded-xl shadow-sm border p-3 sm:p-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4">
                  <h2 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Data Visualization
                  </h2>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleChartTypeChange('pie')}
                      className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                        chartType === 'pie'
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <PieChart className="h-3 w-3 sm:h-4 sm:w-4 inline-block mr-1" />
                      Pie Chart
                    </button>
                    <button
                      onClick={() => handleChartTypeChange('bar')}
                      className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                        chartType === 'bar'
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <BarChart className="h-3 w-3 sm:h-4 sm:w-4 inline-block mr-1" />
                      Bar Chart
                    </button>
                    <button
                      onClick={() => handleChartTypeChange('line')}
                      className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                        chartType === 'line'
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <LineChart className="h-3 w-3 sm:h-4 sm:w-4 inline-block mr-1" />
                      Line Chart
                    </button>
                  </div>
                </div>

                {/* Column Selector */}
                {schema && schema.columns.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Select Column to Visualize
                    </label>
                    <select
                      value={selectedColumn}
                      onChange={(e) => {
                        setSelectedColumn(e.target.value);
                        updateChartData(e.target.value);
                      }}
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm ${
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

                {/* Chart container with responsive height */}
                <div className="w-full h-[300px] sm:h-[400px]" ref={chartRef}>
                  <DataVisualization
                    data={queryResult?.chartData}
                    chartType={chartType}
                    darkMode={darkMode}
                    chartTitle={queryResult?.chartTitle}
                    chartSubtitle={queryResult?.chartSubtitle}
                  />
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