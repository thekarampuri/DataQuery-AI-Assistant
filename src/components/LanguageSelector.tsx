import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages } from 'lucide-react';

interface Props {
  darkMode: boolean;
}

const LanguageSelector: React.FC<Props> = ({ darkMode }) => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' }
  ];

  return (
    <div className="flex items-center">
      <div className="relative">
        <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
          className={`flex items-center pl-9 pr-8 py-2 rounded-lg text-sm font-medium appearance-none ${
            darkMode
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector; 