import { DataSchema } from '../utils/api';

export interface FileMetadata {
  name: string;
  uploadDate: Date;
  schema: DataSchema;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChartData {
  type: 'pie' | 'bar' | 'line';
  data: Array<{ name: string; value: number }>;
  title?: string;
  subtitle?: string;
}

export interface QueryResult {
  answer: string;
  sqlQuery: string;
  needsChart: boolean;
  chartType: 'pie' | 'bar' | 'line' | null;
  chartData?: Array<{ name: string; value: number }>;
  chartDataColumn?: string;
  executionTime?: number;
  confidence?: number;
  chartTitle?: string;
  chartSubtitle?: string;
  excelFormula: string;
}

export interface HistorySession {
  id: string;
  userId: string;
  file: FileMetadata;
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
  queries: Array<QueryResult>;
  createdAt: Date;
  lastUpdated: Date;
  title: string;
} 