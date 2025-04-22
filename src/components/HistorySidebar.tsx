import React from 'react';
import { Clock, Trash2, FileSpreadsheet, PlusCircle } from 'lucide-react';
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
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-[80px] left-0 h-[calc(100vh-80px)] w-64 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* History List */}
        <div className="overflow-y-auto h-[calc(100%-80px)] px-2">
          {sessions.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer group transition-colors ${
                    session.id === currentSessionId
                      ? darkMode
                        ? 'bg-gray-700'
                        : 'bg-indigo-50'
                      : darkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onSelectSession(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <FileSpreadsheet className={`h-4 w-4 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <div>
                        <h3 className={`text-sm font-medium truncate max-w-[150px] ${
                          darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {session.file.name}
                        </h3>
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity ${
                        darkMode
                          ? 'hover:bg-gray-600 text-gray-400'
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {session.conversation.length > 0 && (
                    <p className={`mt-2 text-xs truncate ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {session.conversation[session.conversation.length - 1].content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar; 