import React, { useState } from 'react';
import { BookOpen, Video, Download, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import { useLanguage } from '../contexts/LanguageContext';

const Education: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'practices' | 'videos'>('guide');
  const { t, language } = useLanguage();

  const userGuide = {
    sections: [
      {
        title: t('gettingStarted'),
        content: [
          "1. Upload Data: Click the upload area or drag-and-drop Excel/CSV files",
          "2. Preview Data: View your data in the table format with automatic column type detection",
          "3. Navigate: Use pagination to browse through large datasets",
          "4. Dark/Light Mode: Toggle using the sun/moon icon for comfortable viewing"
        ]
      },
      {
        title: t('dataAnalysisFeatures'),
        content: [
          "1. Natural Language Queries:",
          "   • Type your question in the query box",
          "   • Use voice input with the microphone button",
          "   • Press Enter or click 'Query' to analyze",
          "2. Voice Features:",
          "   • Click microphone to start/stop voice input",
          "   • Speak naturally to form your query",
          "3. Visualization Options:",
          "   • Pie Charts for categories",
          "   • Bar Charts for comparisons",
          "   • Line Charts for trends"
        ]
      },
      {
        title: t('sqlGeneration'),
        content: [
          "1. Enter a table name in the SQL section",
          "2. Choose database type (MySQL, SQLite, PostgreSQL)",
          "3. Click 'Generate SQL' to create queries",
          "4. Copy queries or use the online compiler"
        ]
      },
      {
        title: t('reportGeneration'),
        content: [
          "1. Click 'Export PDF' for comprehensive reports",
          "2. Reports include:",
          "   • Conversation history",
          "   • Query results",
          "   • Data visualizations",
          "   • Chart details"
        ]
      }
    ]
  };

  const bestPractices = [
    {
      title: t('dataPreparation'),
      tips: [
        "Clean and validate data before upload",
        "Use consistent date formats (YYYY-MM-DD)",
        "Remove duplicate entries",
        "Handle missing values appropriately",
        "Use clear column headers",
        "Validate numerical data",
        "Check for outliers"
      ]
    },
    {
      title: t('queryFormation'),
      tips: [
        "Be specific in your questions",
        "Include relevant column names",
        "Use natural language",
        "Start with simple queries",
        "Build up to complex analysis",
        "Verify results with different approaches",
        "Document your analysis process"
      ]
    },
    {
      title: t('visualizationBestPractices'),
      tips: [
        "Choose appropriate chart types",
        "Consider data distribution",
        "Use clear labels and titles",
        "Compare related data sets",
        "Highlight important insights",
        "Maintain consistent scales",
        "Use color effectively"
      ]
    },
    {
      title: t('performanceOptimization'),
      tips: [
        "Limit dataset size for better performance",
        "Use efficient query patterns",
        "Cache frequently used results",
        "Break down complex analyses",
        "Regular system maintenance",
        "Monitor resource usage",
        "Optimize large queries"
      ]
    }
  ];

  const videoTutorials = [
    {
      id: '1',
      title: t('completeDataQueryTutorial'),
      description: t('comprehensiveGuide'),
      duration: '45:00',
      topics: [
        'Data upload and preprocessing',
        'Natural language queries',
        'Voice commands',
        'Visualization options',
        'SQL generation',
        'Report creation'
      ]
    },
    {
      id: '2',
      title: t('advancedDataAnalysis'),
      description: t('masterComplexTechniques'),
      duration: '30:00',
      topics: [
        'Statistical analysis',
        'Pattern recognition',
        'Trend analysis',
        'Predictive queries',
        'Custom visualizations'
      ]
    },
    {
      id: '3',
      title: t('sqlDatabaseIntegration'),
      description: t('deepDiveSql'),
      duration: '25:00',
      topics: [
        'Database selection',
        'Query optimization',
        'Schema design',
        'Data migration',
        'Performance tuning'
      ]
    }
  ];

  const generateUserGuidePDF = () => {
    const pdf = new jsPDF();
    let yOffset = 20;

    // Add a decorative header
    pdf.setFillColor(66, 102, 241);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 40, 'F');

    // Add logo-like design
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text(t('dataQueryAI'), 20, 25);

    // Add subtitle
    pdf.setFontSize(14);
    pdf.text(t('userGuide'), 20, 35);

    yOffset = 50;

    // Add decorative line
    pdf.setDrawColor(66, 102, 241);
    pdf.setLineWidth(0.5);
    pdf.line(20, yOffset, pdf.internal.pageSize.getWidth() - 20, yOffset);
    yOffset += 10;

    // Sections
    userGuide.sections.forEach((section, index) => {
      // Section title with background
      pdf.setFillColor(240, 242, 255);
      pdf.rect(20, yOffset - 5, pdf.internal.pageSize.getWidth() - 40, 12, 'F');
      
      pdf.setTextColor(66, 102, 241);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${section.title}`, 25, yOffset + 3);
      yOffset += 15;

      // Section content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      section.content.forEach(line => {
        if (yOffset > 250) {
          // Add page number before creating new page
          pdf.setFontSize(10);
          pdf.text(`${pdf.internal.getNumberOfPages()}`, pdf.internal.pageSize.getWidth() - 25, pdf.internal.pageSize.getHeight() - 10);
          
          pdf.addPage();
          // Add header to new page
          pdf.setFillColor(66, 102, 241);
          pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 20, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(12);
          pdf.text(t('dataQueryAI'), 20, 13);
          
          yOffset = 40;
        }
        
        // Add bullet points for list items
        if (line.startsWith('•')) {
          pdf.circle(25, yOffset - 2, 1, 'F');
          pdf.text(line.substring(1), 30, yOffset);
        } else {
          pdf.text(line, 25, yOffset);
        }
        yOffset += 8;
      });
      yOffset += 10;
    });

    // Add page number to the last page
    pdf.setFontSize(10);
    pdf.text(`${pdf.internal.getNumberOfPages()}`, pdf.internal.pageSize.getWidth() - 25, pdf.internal.pageSize.getHeight() - 10);

    // Add footer with date
    const date = new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'mr-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.setFontSize(10);
    pdf.text(date, 20, pdf.internal.pageSize.getHeight() - 10);

    pdf.save(`dataquery-user-guide-${language}.pdf`);
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('learningCenter')}
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center px-4 py-2 ${
            activeTab === 'guide'
              ? darkMode
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'border-b-2 border-indigo-600 text-indigo-600'
              : ''
          }`}
        >
          <Info className="w-4 h-4 mr-2" />
          {t('userGuide')}
        </button>
        <button
          onClick={() => setActiveTab('practices')}
          className={`flex items-center px-4 py-2 ${
            activeTab === 'practices'
              ? darkMode
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'border-b-2 border-indigo-600 text-indigo-600'
              : ''
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          {t('bestPractices')}
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center px-4 py-2 ${
            activeTab === 'videos'
              ? darkMode
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'border-b-2 border-indigo-600 text-indigo-600'
              : ''
          }`}
        >
          <Video className="w-4 h-4 mr-2" />
          {t('videoTutorials')}
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('userGuide')}
              </h2>
              <button
                onClick={generateUserGuidePDF}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white`}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('downloadPDF')}
              </button>
            </div>
            <div className="grid gap-6">
              {userGuide.sections.map((section, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.content.map((item, i) => (
                      <li key={i} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'practices' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bestPractices.map((practice, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <h3 className="text-lg font-semibold mb-4">{practice.title}</h3>
                <ul className="space-y-2">
                  {practice.tips.map((tip, i) => (
                    <li key={i} className={`flex items-start ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videoTutorials.map(tutorial => (
              <div
                key={tutorial.id}
                className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <h3 className="text-lg font-semibold mb-2">{tutorial.title}</h3>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {tutorial.description}
                </p>
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <div className={`w-full h-48 ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-200'
                  } flex items-center justify-center rounded-lg`}>
                    <Video className="w-12 h-12" />
                  </div>
                </div>
                <div className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('videoDuration')}: {tutorial.duration}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">{t('topicsCovered')}:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {tutorial.topics.map((topic, index) => (
                      <li key={index} className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Education; 