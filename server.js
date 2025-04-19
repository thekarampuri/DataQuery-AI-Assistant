const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'DataQuery AI Assistant API is running' });
});

// Store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handle Excel upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Generate schema with improved type detection
    const columns = Object.keys(jsonData[0]).map(key => {
      const values = jsonData.map(row => row[key]);
      const types = new Set(values.map(value => {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'number') {
          return Number.isInteger(value) ? 'integer' : 'float';
        }
        if (typeof value === 'boolean') return 'boolean';
        if (value instanceof Date) return 'date';
        return 'string';
      }));
      
      return {
        name: key,
        type: types.has('float') ? 'float' : 
              types.has('integer') ? 'integer' :
              types.has('boolean') ? 'boolean' :
              types.has('date') ? 'date' : 'string'
      };
    });

    // Calculate basic statistics for each column
    const columnStats = columns.map(col => {
      const values = jsonData.map(row => row[col.name]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined);
      
      const stats = {
        name: col.name,
        type: col.type,
        totalCount: values.length,
        nonNullCount: nonNullValues.length,
        nullCount: values.length - nonNullValues.length
      };

      if (col.type === 'integer' || col.type === 'float') {
        stats.min = Math.min(...nonNullValues);
        stats.max = Math.max(...nonNullValues);
        stats.avg = nonNullValues.reduce((a, b) => a + b, 0) / nonNullValues.length;
      } else if (col.type === 'string') {
        const uniqueValues = new Set(nonNullValues);
        stats.uniqueCount = uniqueValues.size;
        stats.mostCommon = Array.from(uniqueValues)
          .map(value => ({
            value,
            count: nonNullValues.filter(v => v === value).length
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }

      return stats;
    });

    return res.json({
      schema: { columns },
      columnStats,
      data: jsonData.slice(0, 100), // limit to 100 rows
      totalRows: jsonData.length
    });
  } catch (err) {
    console.error('Error processing file:', err);
    res.status(500).json({ 
      error: 'Failed to process Excel file',
      details: err.message 
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
}); 