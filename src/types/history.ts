import { DataSchema } from '../utils/api';

export interface FileMetadata {
  name: string;
  uploadDate: Date;
  schema: DataSchema;
  data: any[]; // Complete dataset
  previewData: any[]; // First 10 rows for preview
  totalRows: number;
  fileType: string;
  fileSize: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date; // Make timestamp required
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
  chartTitle?: string;
  chartSubtitle?: string;
  chartDataColumn?: string;
  excelFormula?: string;
  timestamp: Date; // Make timestamp required
}

export interface HistorySession {
  id: string;
  file: FileMetadata;
  conversation: ConversationMessage[];
  queries: QueryResult[];
  createdAt: Date;
  updatedAt: Date;
} 