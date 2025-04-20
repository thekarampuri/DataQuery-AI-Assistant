import React, { useState } from 'react';
import { LogIn, User } from 'lucide-react';
import Auth from './Auth';

interface LandingPageProps {
  darkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ darkMode }) => {
  const [authMode, setAuthMode] = useState<'none' | 'signin' | 'signup'>('none');

  // If auth mode is selected, show the Auth component
  if (authMode !== 'none') {
    return (
      <Auth 
        initialMode={authMode === 'signin' ? 'login' : 'signup'} 
        onClose={() => setAuthMode('none')}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
    }`}>
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            DataQuery AI Assistant
          </h1>
          <p className={`text-base sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your intelligent companion for data analysis
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => setAuthMode('signin')}
            className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors text-sm sm:text-base"
          >
            <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Sign In
          </button>

          <button
            onClick={() => setAuthMode('signup')}
            className={`w-full flex items-center justify-center px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base ${
              darkMode 
                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                : 'bg-white text-gray-900 hover:bg-gray-50'
            } border-2 border-transparent transition-colors`}
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 