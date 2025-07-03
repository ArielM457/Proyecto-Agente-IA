import React, { useState, useEffect } from 'react';
import './App.css';  // Esta línea debe estar al inicio con las demás importaciones
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { 
  Box, Button, CircularProgress, Typography 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [userId] = useState('default-user');

  // Cargar historial al iniciar
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/history`, {
          headers: { 'x-user-id': userId }
        });
        setChatHistory(response.data?.history || response.data?.chats || []);
      } catch (err) {
        console.error("Error cargando historial:", err);
        setChatHistory([]);
      }
    };
    loadHistory();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/functions`,
        { question: input, style: "default" },
        {
          headers: { 'x-user-id': userId },
          params: { chatId: currentChatId }
        }
      );
      
      setMessages(response.data?.history || []);
      setCurrentChatId(response.data?.chatId || null);
      
      if (!currentChatId) {
        setChatHistory(prev => [{
          id: response.data?.chatId,
          title: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
          lastMessage: response.data?.response?.substring(0, 50) + '...' || 'Nuevo chat',
          timestamp: new Date().toISOString()
        }, ...prev]);
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const loadChat = async (chatId) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/functions`,
        { action: "load_chat" },
        {
          headers: { 'x-user-id': userId },
          params: { chatId: chatId }
        }
      );
      
      setMessages(response.data?.history || []);
      setCurrentChatId(chatId);
      setError(null);
    } catch (err) {
      setError("Error cargando chat: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setError(null);
  };

  return (
    <div className="app-container">
      {/* Sidebar - Historial */}
      <div className="sidebar">
        <div className="sidebar-header">
          <Typography variant="h6">
            <HistoryIcon style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Historial de Chats
          </Typography>
        </div>
        
        <button className="new-chat-btn" onClick={newChat}>
          Nuevo Chat
        </button>
        
        <div className="chat-list">
          {chatHistory?.length > 0 ? (
            chatHistory.map((chat) => (
              <button
                key={chat?.id || Math.random()}
                className={`chat-item ${chat?.id === currentChatId ? 'selected' : ''}`}
                onClick={() => chat?.id && loadChat(chat.id)}
              >
                <Typography noWrap style={{ fontWeight: 'bold' }}>
                  {chat?.title || 'Chat sin título'}
                </Typography>
                <Typography noWrap style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {chat?.lastMessage || chat?.preview || 'Sin mensajes'}
                </Typography>
              </button>
            ))
          ) : (
            <Typography style={{ padding: 16, color: 'var(--text-light)' }}>
              No hay chats históricos
            </Typography>
          )}
        </div>
      </div>

      {/* Área principal del chat */}
      <div className="chat-main">
        <div className="chat-header">
          <Typography variant="h6">Bienvenido a Vexa</Typography>
        </div>
        
        <div className="messages-container">
          {messages?.map((msg, idx) => (
            <div 
              key={idx} 
              className={`message ${msg.role}`}
            >
              <div className="message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <span className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="message error">
              <Typography>{error}</Typography>
            </div>
          )}
        </div>
        
        <div className="input-container">
          <form className="input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="send-btn"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <CircularProgress size={20} style={{ color: 'white' }} />
              ) : (
                <>
                  Enviar <SendIcon style={{ fontSize: 18, marginLeft: 6 }} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;