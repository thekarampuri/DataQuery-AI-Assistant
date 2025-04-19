import mysql from 'mysql2/promise';
import { DataSchema } from './api';

// MySQL connection configuration
const dbConfig = {
  host: 'localhost:3306',
  user: 'root',
  password: 'akhil007', // Change this to your MySQL password
  database: 'dataquery',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database - create if not exists
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Create a temporary connection to MySQL server
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    // Create database if it doesn't exist
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempConnection.end();
    
    console.log(`Database '${dbConfig.database}' initialized successfully`);
    return;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Helper function to determine MySQL data type from schema type
const getMySQLType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'number':
      return 'DOUBLE';
    case 'boolean':
      return 'BOOLEAN';
    case 'datetime':
      return 'DATETIME';
    default:
      return 'VARCHAR(255)';
  }
};

// Create table from schema
export const createTable = async (schema: DataSchema): Promise<void> => {
  try {
    const tableName = schema.tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    // Generate column definitions
    const columnDefinitions = schema.columns.map(col => {
      const mysqlType = getMySQLType(col.type);
      return `\`${col.name.replace(/[^a-zA-Z0-9_]/g, '_')}\` ${mysqlType}`;
    }).join(', ');
    
    // Create table query
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ${columnDefinitions}
      )
    `;
    
    // Execute query
    await pool.execute(createTableQuery);
    console.log(`Table '${tableName}' created or already exists`);
    return;
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};

// Insert data into table
export const insertData = async (schema: DataSchema, data: any[]): Promise<void> => {
  try {
    const tableName = schema.tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const columnNames = schema.columns.map(col => `\`${col.name.replace(/[^a-zA-Z0-9_]/g, '_')}\``);
    
    // First clear existing data
    await pool.execute(`TRUNCATE TABLE \`${tableName}\``);
    
    // Prepare batch insert
    for (let i = 0; i < data.length; i += 100) {
      const batch = data.slice(i, i + 100);
      
      // Create placeholders for each row
      const placeholders = batch.map(() => 
        `(${schema.columns.map(() => '?').join(', ')})`
      ).join(', ');
      
      // Flatten values for batch insert
      const values = batch.flatMap(row => 
        schema.columns.map(col => {
          const value = row[col.name];
          // Handle different data types
          if (value === undefined || value === null) return null;
          if (col.type === 'datetime' && value instanceof Date) return value;
          return value;
        })
      );
      
      // Insert query
      const insertQuery = `
        INSERT INTO \`${tableName}\` (${columnNames.join(', ')})
        VALUES ${placeholders}
      `;
      
      await pool.execute(insertQuery, values);
    }
    
    console.log(`Inserted ${data.length} rows into table '${tableName}'`);
    return;
  } catch (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
};

// Execute SQL query
export const executeQuery = async (query: string): Promise<any[]> => {
  try {
    const [rows] = await pool.execute(query);
    return rows as any[];
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

// Check if table exists
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, tableName]
    );
    
    const result = rows as any[];
    return result[0].count > 0;
  } catch (error) {
    console.error('Error checking if table exists:', error);
    return false;
  }
};