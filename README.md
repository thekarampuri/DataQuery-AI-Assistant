# DataQuery AI Assistant 🤖

A powerful data analysis and visualization tool that combines natural language processing with interactive data exploration. This application allows users to analyze their data using plain English queries and visualize the results through dynamic charts.

## 📸 Application Preview

Here's a quick look at the DataQuery AI Assistant in action:

![DataQuery AI Assistant Demo](screenshots/demo.gif)

## ✨ Features

### 1. Intuitive Data Upload 📊
- Support for CSV and Excel files
- Automatic schema detection
- Real-time data preview
- Dark/Light mode support
- Paginated data view with copy functionality

### 2. Natural Language Queries 💬
- Ask questions about your data in plain English
- Voice input support for queries
- Real-time query processing
- Conversation history tracking
- Text-to-speech response playback
- Copy query responses to clipboard

### 3. Interactive Data Visualization 📈
- Multiple chart types:
  - Bar Charts
  - Pie Charts
  - Line Charts
- Dynamic data updates
- Column-specific visualizations
- Dark mode compatible charts
- Chart title and subtitle support
- Responsive chart sizing

### 4. Voice Input Capabilities 🎤
- Real-time speech-to-text conversion
- Voice query support
- Visual feedback during recording
- Multiple language support
- Professional voice selection for responses

### 5. Advanced Data Analysis 📊
- Automatic data type detection
- Column-based analysis
- Distribution visualization
- Pattern recognition
- SQL query generation
- Excel formula suggestions

### 6. Export Capabilities 📁
- Export analysis as PDF with:
  - Conversation history
  - SQL queries
  - Visualizations
  - Professional formatting
- Copy row data to clipboard
- Save visualization results
- Export SQL queries for database import

### 7. User Experience 🎯
- Responsive design for all screen sizes
- Smooth animations and transitions
- Intuitive navigation
- Clear error handling
- Loading states and feedback
- Guest access support

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dataquery-ai-assistant.git
```

2. Navigate to the project directory:
```bash
cd dataquery-ai-assistant
```

3. Install dependencies:
```bash
npm install
# or
yarn install
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and visit `http://localhost:5173`

## 🎯 Usage

1. **Upload Data**
   - Click the upload area or drag and drop your CSV/Excel file
   - Preview your data in the table view with pagination
   - Copy individual rows to clipboard
   ![Data Upload](screenshots/data-upload.png)

2. **Query Your Data**
   - Type your question in the query box
   - Use voice input with the microphone icon
   - View conversation history
   - Listen to responses with text-to-speech
   ![Query Interface](screenshots/data-analysis.png)

3. **Visualize Results**
   - Select different chart types using the visualization controls
   - Choose specific columns to analyze
   - Toggle between dark and light modes
   - View chart data in a grid layout
   ![Data Analysis](screenshots/data-analysis.png)

4. **Export Results**
   - Export comprehensive PDF reports
   - Copy SQL queries for database import
   - Get Excel formula suggestions
   - Copy specific data rows
   ![Export Options](screenshots/export-options.png)

5. **SQL Conversion**
   - Generate SQL queries from your data
   - Customize table names
   - Copy generated SQL
   - Open in online SQL compiler

## 🛠️ Technologies Used

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **File Processing**: xlsx
- **PDF Export**: jspdf, html2canvas
- **Voice Input**: Web Speech API
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Authentication**: Firebase Auth

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chart.js for the visualization library
- Tailwind CSS for the styling framework
- The React community for amazing tools and support
- Firebase for authentication services
- Web Speech API for voice capabilities

