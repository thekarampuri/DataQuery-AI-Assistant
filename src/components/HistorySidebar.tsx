import React from 'react';
import { Clock, FileSpreadsheet, ChevronLeft, ChevronRight, Trash2, PlusCircle } from 'lucide-react';
import { HistorySession } from '../types/history';

interface HistorySidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: HistorySession[];
  currentSessionId: string | null;
  onSelectSession: (session: HistorySession) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewChat: () => void;
  darkMode: boolean;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  toggleSidebar,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  darkMode
}) => {
  return (
    <div className={`fixed top-[80px] bottom-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className={`relative h-full w-64 sm:w-80 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-r shadow-lg`}>
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`absolute -right-10 top-4 p-2 rounded-r-lg ${
            darkMode 
              ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          } shadow-md`}
        >
          <Clock size={20} />
        </button>

        {/* Sidebar Content */}
        <div className="h-full overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold flex items-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Clock className="w-5 h-5 mr-2" />
              History
            </h2>
            <button
              onClick={onNewChat}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title="New Chat"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors relative group ${
                  session.id === currentSessionId
                    ? darkMode
                      ? 'bg-indigo-900/50 border-indigo-500'
                      : 'bg-indigo-50 border-indigo-200'
                    : darkMode
                      ? 'hover:bg-gray-700 border-gray-700'
                      : 'hover:bg-gray-50 border-gray-200'
                } border`}
                onClick={() => onSelectSession(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileSpreadsheet className={`w-5 h-5 mt-0.5 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div>
                      <h3 className={`font-medium text-sm ${
                        darkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {session.title || session.file.name}
                      </h3>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {new Date(session.lastUpdated).toLocaleDateString()}
                      </p>
                      <p className={`text-xs mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {session.conversation.length} messages
                      </p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity ${
                      darkMode
                        ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200'
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className={`text-center py-8 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <p className="text-sm">No history yet</p>
                <p className="text-xs mt-2">Upload a file to start analyzing data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorySidebar; 