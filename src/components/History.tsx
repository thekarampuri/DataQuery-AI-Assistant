import React, { useEffect, useState } from 'react';
import { getUserSessions } from '../services/historyService';
import { HistorySession } from '../types/history';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const History: React.FC = () => {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userSessions = await getUserSessions(user.uid);
        setSessions(userSessions);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  if (loading) {
    return <div className="p-4">Loading history...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!sessions.length) {
    return <div className="p-4">No chat history available</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold mb-4">Chat History</h2>
      {sessions.map((session) => (
        <div key={session.id} className="border rounded-lg p-4 space-y-3 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{session.file.name}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Conversation:</p>
            <div className="pl-4 space-y-2">
              {session.conversation.map((msg, idx) => (
                <div key={idx} className={`text-sm ${msg.role === 'assistant' ? 'text-blue-600' : ''}`}>
                  <span className="font-medium">{msg.role === 'assistant' ? 'AI: ' : 'You: '}</span>
                  {msg.content}
                </div>
              ))}
            </div>
          </div>

          {session.queries.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Queries:</p>
              <div className="pl-4 space-y-2">
                {session.queries.map((query, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-mono bg-gray-100 p-2 rounded">{query.sqlQuery}</p>
                    {query.excelFormula && (
                      <p className="font-mono text-green-600 mt-1">Excel: {query.excelFormula}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default History; 