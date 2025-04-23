import React from 'react';
import { X, Trash2, PlusCircle } from 'lucide-react';
import { ConversationMessage } from '../types/history';
import { getConversationHistory } from '../services/rtdbService';
import { useAuth } from '../hooks/useAuth';

interface Props {
  isOpen: boolean;
  toggleSidebar: () => void;
  onNewChat: () => void;
  darkMode: boolean;
}

const HistorySidebar: React.FC<Props> = ({
  isOpen,
  toggleSidebar,
  onNewChat,
  darkMode
}) => {
  const [conversations, setConversations] = React.useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    const loadConversations = async () => {
      if (user) {
        try {
          console.log('Loading conversations for user:', user.uid);
          const history = await getConversationHistory(user.uid);
          console.log('Loaded conversation history:', history);
          setConversations(history);
        } catch (error) {
          console.error('Error loading conversation history:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (isOpen) {
      setIsLoading(true);
      loadConversations();
    }
  }, [isOpen, user]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Add overlay for mobile
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-80 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } z-50 ${
          darkMode 
            ? 'bg-gray-900 text-gray-100 border-r border-gray-700' 
            : 'bg-white text-gray-900 border-r border-gray-200'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className={`p-4 flex items-center justify-between ${
            darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Conversation History
            </h2>
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                darkMode
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
            <button
              onClick={onNewChat}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-100'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              New Chat
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                  darkMode ? 'border-gray-400' : 'border-indigo-500'
                }`}></div>
                <span className={`ml-3 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Loading conversations...</span>
              </div>
            ) : conversations.length > 0 ? (
              <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {conversations.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 transition-colors duration-200 ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm ${message.role === 'user' ? 'font-medium' : ''} ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className={`mt-1 text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {message.message}
                    </div>
                    <div className={`mt-1 text-xs ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-4 text-center ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No conversation history
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar; 