import React, { useState } from 'react';
import { LogIn, UserPlus, User } from 'lucide-react';
import Auth from './Auth';

interface LandingPageProps {
  darkMode: boolean;
  onGuestAccess: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ darkMode, onGuestAccess }) => {
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'signup'>('none');

  if (authMode === 'login') {
    return <Auth initialMode="login" />;
  }

  if (authMode === 'signup') {
    return <Auth initialMode="signup" />;
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
      <div className="text-center space-y-8 p-8 rounded-xl max-w-md w-full">
        <div className="space-y-4">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            DataQuery AI Assistant
          </h1>
          <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your intelligent companion for data analysis
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setAuthMode('login')}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors`}
          >
            <LogIn className="h-5 w-5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => setAuthMode('signup')}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg ${
              darkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <UserPlus className="h-5 w-5" />
            <span>Create Account</span>
          </button>

          <button
            onClick={onGuestAccess}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg ${
              darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Continue as Guest</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 