export type Language = 'en' | 'hi' | 'mr';

export type TranslationKey =
  | 'query'
  | 'darkMode'
  | 'lightMode'
  | 'home'
  | 'learn'
  | 'dataInput'
  | 'uploadFile'
  | 'dragAndDrop'
  | 'fileUploaded'
  | 'excelFormula'
  | 'sqlQuery'
  | 'dataQueryAI'
  | 'analyzeData'
  | 'generated'
  | 'user'
  | 'assistant'
  | 'results'
  | 'page'
  | 'of'
  | 'actions'
  | 'copyRowData'
  | 'previous'
  | 'next'
  | 'conversationHistory'
  | 'queryPlaceholder'
  | 'analyzing'
  | 'startVoice'
  | 'stopVoice'
  | 'listenMessage'
  | 'stopSpeaking'
  | 'copyMessage'
  | 'exportPDF'
  | 'noResults'
  | 'copySql'
  | 'copied'
  | 'dataPreview'
  | 'columnDefinitions'
  | 'column'
  | 'type'
  | 'dataVisualize'
  | 'pieChart'
  | 'barChart'
  | 'lineChart'
  | 'selectColumnToVisualize'
  | 'noDataToVisualize'
  | 'sqlConversion'
  | 'tableName'
  | 'enterTableName'
  | 'sqlType'
  | 'generateSql'
  | 'openSqlOnlineCompiler'
  | 'learningCenter'
  | 'userGuide'
  | 'bestPractices'
  | 'videoTutorials'
  | 'downloadPDF'
  | 'returnToApp'
  | 'gettingStarted'
  | 'dataAnalysisFeatures'
  | 'sqlGeneration'
  | 'reportGeneration'
  | 'dataPreparation'
  | 'queryFormation'
  | 'visualizationBestPractices'
  | 'performanceOptimization'
  | 'videoDuration'
  | 'topicsCovered'
  | 'completeDataQueryTutorial'
  | 'comprehensiveGuide'
  | 'advancedDataAnalysis'
  | 'masterComplexTechniques'
  | 'sqlDatabaseIntegration'
  | 'deepDiveSql'
  | 'uploadFirst'
  | 'errorOccurred'
  | 'tryAgain'
  | 'speechNotSupported'
  | 'signOut'
  | 'dataAnalysis';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    // App Title and Navigation
    dataQueryAI: 'DataQuery AI Assistant',
    analyzeData: 'Analyze and Visualize Your Data',
    home: 'Home',
    learn: 'Learn',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',

    // Data Input Section
    dataInput: 'Data Input',
    uploadFile: 'Upload your Excel or CSV file',
    dragAndDrop: 'Drag and drop or click to browse',
    fileUploaded: 'File uploaded',
    actions: 'Actions',
    copyRowData: 'Copy row data',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',

    // Data Analysis Section
    dataAnalysis: 'Data Analysis',
    conversationHistory: 'Conversation History',
    queryPlaceholder: 'Ask questions about your data in plain English...',
    analyzing: 'Analyzing...',
    query: 'Query',
    startVoice: 'Start voice input',
    stopVoice: 'Stop voice input',
    listenMessage: 'Listen to message',
    stopSpeaking: 'Stop speaking',
    copyMessage: 'Copy message',

    // Results Section
    results: 'Results',
    exportPDF: 'Export PDF',
    noResults: 'Ask a question about your data to see the analysis results here',
    sqlQuery: 'SQL Query',
    excelFormula: 'Excel Formula',
    copySql: 'Copy SQL query',
    copied: 'Copied!',

    // Data Preview Section
    dataPreview: 'Data Preview',
    columnDefinitions: 'Column Definitions',
    column: 'Column',
    type: 'Type',

    // Visualization Section
    dataVisualize: 'Data Visualization',
    pieChart: 'Pie Chart',
    barChart: 'Bar Chart',
    lineChart: 'Line Chart',
    selectColumnToVisualize: 'Select Column to Visualize',
    noDataToVisualize: 'No data to visualize',

    // SQL Conversion Section
    sqlConversion: 'SQL Conversion',
    tableName: 'Table Name',
    enterTableName: 'Enter table name',
    sqlType: 'SQL Type',
    generateSql: 'Generate SQL',
    openSqlOnlineCompiler: 'Open SQL Online Compiler',

    // Learning Center
    learningCenter: 'Learning Center',
    userGuide: 'User Guide',
    bestPractices: 'Best Practices',
    videoTutorials: 'Video Tutorials',
    downloadPDF: 'Download PDF',
    returnToApp: 'Return to main application',

    // Learning Center Content
    gettingStarted: 'Getting Started',
    dataAnalysisFeatures: 'Data Analysis Features',
    sqlGeneration: 'SQL Generation',
    reportGeneration: 'Report Generation',
    
    // Best Practices Categories
    dataPreparation: 'Data Preparation',
    queryFormation: 'Query Formation',
    visualizationBestPractices: 'Visualization Best Practices',
    performanceOptimization: 'Performance Optimization',
    
    // Video Tutorial Content
    videoDuration: 'Duration',
    topicsCovered: 'Topics covered',
    completeDataQueryTutorial: 'Complete DataQuery AI Tutorial',
    comprehensiveGuide: 'A comprehensive guide to all features',
    advancedDataAnalysis: 'Advanced Data Analysis',
    masterComplexTechniques: 'Master complex data analysis techniques',
    sqlDatabaseIntegration: 'SQL and Database Integration',
    deepDiveSql: 'Deep dive into SQL features',

    // Error Messages
    uploadFirst: 'Please upload data first',
    errorOccurred: 'An error occurred',
    tryAgain: 'Please try again',
    speechNotSupported: 'Speech recognition is not supported in your browser',

    generated: 'Generated on',
    user: 'User',
    assistant: 'Assistant',
    signOut: 'Sign Out',
  },
  hi: {
    // Hindi translations (same structure as English)
    dataQueryAI: 'डेटाक्वेरी एआई असिस्टेंट',
    analyzeData: 'अपना डेटा विश्लेषण और विज़ुअलाइज़ करें',
    home: 'होम',
    learn: 'सीखें',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',

    dataInput: 'डेटा इनपुट',
    uploadFile: 'अपनी एक्सेल या CSV फ़ाइल अपलोड करें',
    dragAndDrop: 'खींचें और छोड़ें या ब्राउज़ करने के लिए क्लिक करें',
    fileUploaded: 'फ़ाइल अपलोड की गई',
    actions: 'कार्रवाई',
    copyRowData: 'पंक्ति डेटा कॉपी करें',
    previous: 'पिछला',
    next: 'अगला',
    page: 'पृष्ठ',
    of: 'का',

    dataAnalysis: 'डेटा विश्लेषण',
    conversationHistory: 'वार्तालाप इतिहास',
    queryPlaceholder: 'अपने डेटा के बारे में सामान्य भाषा में प्रश्न पूछें...',
    analyzing: 'विश्लेषण कर रहा है...',
    query: 'प्रश्न',
    startVoice: 'वॉइस इनपुट शुरू करें',
    stopVoice: 'वॉइस इनपुट बंद करें',
    listenMessage: 'संदेश सुनें',
    stopSpeaking: 'बोलना बंद करें',
    copyMessage: 'संदेश कॉपी करें',

    results: 'परिणाम',
    exportPDF: 'PDF निर्यात करें',
    noResults: 'परिणाम देखने के लिए अपने डेटा के बारे में कोई प्रश्न पूछें',
    sqlQuery: 'SQL क्वेरी',
    excelFormula: 'एक्सेल फॉर्मूला',
    copySql: 'SQL क्वेरी कॉपी करें',
    copied: 'कॉपी किया गया!',

    dataPreview: 'डेटा पूर्वावलोकन',
    columnDefinitions: 'कॉलम परिभाषाएं',
    column: 'कॉलम',
    type: 'प्रकार',

    dataVisualize: 'डेटा विज़ुअलाइज़ेशन',
    pieChart: 'पाई चार्ट',
    barChart: 'बार चार्ट',
    lineChart: 'लाइन चार्ट',
    selectColumnToVisualize: 'विज़ुअलाइज़ करने के लिए कॉलम चुनें',
    noDataToVisualize: 'विज़ुअलाइज़ करने के लिए कोई डेटा नहीं है',

    sqlConversion: 'SQL रूपांतरण',
    tableName: 'टेबल का नाम',
    enterTableName: 'टेबल का नाम दर्ज करें',
    sqlType: 'SQL प्रकार',
    generateSql: 'SQL जनरेट करें',
    openSqlOnlineCompiler: 'SQL ऑनलाइन कंपाइलर खोलें',

    learningCenter: 'लर्निंग सेंटर',
    userGuide: 'उपयोगकर्ता गाइड',
    bestPractices: 'सर्वोत्तम अभ्यास',
    videoTutorials: 'वीडियो ट्यूटोरियल',
    downloadPDF: 'पीडीएफ डाउनलोड करें',
    returnToApp: 'मुख्य एप्लिकेशन पर वापस जाएं',

    // Learning Center Content
    gettingStarted: 'शुरू करें',
    dataAnalysisFeatures: 'डेटा विश्लेषण सुविधाएं',
    sqlGeneration: 'SQL जनरेशन',
    reportGeneration: 'रिपोर्ट जनरेशन',
    
    // Best Practices Categories
    dataPreparation: 'डेटा तैयारी',
    queryFormation: 'क्वेरी निर्माण',
    visualizationBestPractices: 'विज़ुअलाइज़ेशन सर्वोत्तम अभ्यास',
    performanceOptimization: 'प्रदर्शन अनुकूलन',
    
    // Video Tutorial Content
    videoDuration: 'अवधि',
    topicsCovered: 'कवर किए गए विषय',
    completeDataQueryTutorial: 'संपूर्ण डेटाक्वेरी एआई ट्यूटोरियल',
    comprehensiveGuide: 'सभी सुविधाओं के लिए एक व्यापक गाइड',
    advancedDataAnalysis: 'उन्नत डेटा विश्लेषण',
    masterComplexTechniques: 'जटिल डेटा विश्लेषण तकनीकों में महारत हासिल करें',
    sqlDatabaseIntegration: 'SQL और डेटाबेस एकीकरण',
    deepDiveSql: 'SQL सुविधाओं में गहरी समझ',

    uploadFirst: 'कृपया पहले डेटा अपलोड करें',
    errorOccurred: 'एक त्रुटि हुई',
    tryAgain: 'कृपया पुनः प्रयास करें',
    speechNotSupported: 'आपके ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है',

    generated: 'उत्पन्न किया गया',
    user: 'उपयोगकर्ता',
    assistant: 'सहायक',
    signOut: 'साइन आउट',
  },
  mr: {
    // Marathi translations (same structure as English)
    dataQueryAI: 'डेटाक्वेरी एआई असिस्टंट',
    analyzeData: 'तुमचा डेटा विश्लेषण आणि व्हिज्युअलाइझ करा',
    home: 'मुख्यपृष्ठ',
    learn: 'शिका',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',

    dataInput: 'डेटा इनपुट',
    uploadFile: 'तुमची एक्सेल किंवा CSV फाइल अपलोड करा',
    dragAndDrop: 'ड्रॅग अँड ड्रॉप करा किंवा ब्राउझ करण्यासाठी क्लिक करा',
    fileUploaded: 'फाइल अपलोड केली',
    actions: 'क्रिया',
    copyRowData: 'पंक्ती डेटा कॉपी करा',
    previous: 'मागील',
    next: 'पुढील',
    page: 'पृष्ठ',
    of: 'पैकी',

    dataAnalysis: 'डेटा विश्लेषण',
    conversationHistory: 'संभाषण इतिहास',
    queryPlaceholder: 'तुमच्या डेटाबद्दल सामान्य भाषेत प्रश्न विचारा...',
    analyzing: 'विश्लेषण करत आहे...',
    query: 'प्रश्न',
    startVoice: 'व्हॉइस इनपुट सुरू करा',
    stopVoice: 'व्हॉइस इनपुट थांबवा',
    listenMessage: 'संदेश ऐका',
    stopSpeaking: 'बोलणे थांबवा',
    copyMessage: 'संदेश कॉपी करा',

    results: 'परिणाम',
    exportPDF: 'PDF एक्स्पोर्ट करा',
    noResults: 'परिणाम पाहण्यासाठी तुमच्या डेटाबद्दल प्रश्न विचारा',
    sqlQuery: 'SQL क्वेरी',
    excelFormula: 'एक्सेल फॉर्म्युला',
    copySql: 'SQL क्वेरी कॉपी करा',
    copied: 'कॉपी केले!',

    dataPreview: 'डेटा पूर्वावलोकन',
    columnDefinitions: 'स्तंभ व्याख्या',
    column: 'स्तंभ',
    type: 'प्रकार',

    dataVisualize: 'डेटा व्हिज्युअलायझेशन',
    pieChart: 'पाय चार्ट',
    barChart: 'बार चार्ट',
    lineChart: 'लाइन चार्ट',
    selectColumnToVisualize: 'व्हिज्युअलाइझ करण्यासाठी स्तंभ निवडा',
    noDataToVisualize: 'व्हिज्युअलाइझ करण्यासाठी डेटा नाही',

    sqlConversion: 'SQL रूपांतर',
    tableName: 'टेबल नाव',
    enterTableName: 'टेबल नाव एंटर करा',
    sqlType: 'SQL प्रकार',
    generateSql: 'SQL तयार करा',
    openSqlOnlineCompiler: 'SQL ऑनलाइन कंपायलर उघडा',

    learningCenter: 'लर्निंग सेंटर',
    userGuide: 'वापरकर्ता मार्गदर्शक',
    bestPractices: 'सर्वोत्तम पद्धती',
    videoTutorials: 'व्हिडिओ ट्युटोरियल',
    downloadPDF: 'पीडीएफ डाउनलोड करा',
    returnToApp: 'मुख्य अॅप्लिकेशनवर परत जा',

    // Learning Center Content
    gettingStarted: 'सुरु करूया',
    dataAnalysisFeatures: 'डेटा विश्लेषण वैशिष्ट्ये',
    sqlGeneration: 'SQL जनरेशन',
    reportGeneration: 'अहवाल जनरेशन',
    
    // Best Practices Categories
    dataPreparation: 'डेटा तयारी',
    queryFormation: 'क्वेरी तयारी',
    visualizationBestPractices: 'व्हिज्युअलायझेशन सर्वोत्तम पद्धती',
    performanceOptimization: 'कार्यक्षमता ऑप्टिमायझेशन',
    
    // Video Tutorial Content
    videoDuration: 'कालावधी',
    topicsCovered: 'समाविष्ट विषय',
    completeDataQueryTutorial: 'संपूर्ण डेटाक्वेरी एआई ट्युटोरिअल',
    comprehensiveGuide: 'सर्व वैशिष्ट्यांसाठी सविस्तर मार्गदर्शक',
    advancedDataAnalysis: 'प्रगत डेटा विश्लेषण',
    masterComplexTechniques: 'जटिल डेटा विश्लेषण तंत्रांमध्ये प्राविण्य मिळवा',
    sqlDatabaseIntegration: 'SQL आणि डेटाबेस एकत्रीकरण',
    deepDiveSql: 'SQL वैशिष्ट्यांमध्ये सखोल माहिती',

    uploadFirst: 'कृपया प्रथम डेटा अपलोड करा',
    errorOccurred: 'एक त्रुटी आली',
    tryAgain: 'कृपया पुन्हा प्रयत्न करा',
    speechNotSupported: 'तुमच्या ब्राउझरमध्ये स्पीच रेकग्निशन समर्थित नाही',

    generated: 'तयार केले',
    user: 'वापरकर्ता',
    assistant: 'सहाय्यक',
    signOut: 'साइन आउट',
  }
}; 