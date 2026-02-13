import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getApiBaseUrl } from '../utils/UrlUtils';

const MemberChatInterface = ({ memberId }) => {
  const [memberData, setMemberData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Extract token from URL query params or use memberId as fallback
  const getTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("token") || memberId;
  };

  useEffect(() => {
    const token = getTokenFromUrl();

    if (!token) {
      console.error("No token found");
      setLoading(false);
      return;
    }

    const fetchMemberData = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        console.log("Initializing chat with token:", token);
        console.log("API Base URL:", apiBaseUrl);

        const response = await fetch(`${apiBaseUrl}/api/chat/init?token=${token}`);
        const result = await response.json();
        const chatHistory = result?.member?.chat_history || [];

        const formattedMessages = chatHistory.map((msg, i) => ({
          id: i + 1,
          text: msg.message,
          sender: msg.role === "user" ? "user" : "jarvis",
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));

        setMessages(formattedMessages);


        console.log("Chat init response:", result);

        if (!result.success) {
          console.error("Failed to initialize chat:", result);
          setLoading(false);
          return;
        }

        setMemberData(result.member);
        setTeamData(result.team);

      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [memberId]);

  useEffect(() => {
    if (!memberData) return;
    if (messages.length > 0) return;

    // Send welcome message to backend
    const sendWelcomeMessage = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const token = getTokenFromUrl();

        const response = await fetch(`${apiBaseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: token,
            message: "welcome",
            is_welcome: true
          })
        });

        const result = await response.json();

        if (result.success) {
          setMessages(prev => [
            ...prev,
            {
              id: prev.length + 1,
              text: result.response,
              sender: "jarvis",
              timestamp: new Date()
            }
          ]);


        } else {
          console.error("Welcome message failed:", result);
        }
      } catch (err) {
        console.error("Welcome error:", err);
      }
    };

    sendWelcomeMessage();
  }, [memberData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userText = inputMessage

    // Add user message immediately
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        text: userText,
        sender: "user",
        timestamp: new Date()
      }
    ])

    setInputMessage("")
    setIsTyping(true)

    try {
      const apiBaseUrl = getApiBaseUrl()
      const token = getTokenFromUrl()

      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          message: userText,
          is_welcome: false
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: result.response,
            sender: "jarvis",
            timestamp: new Date()
          }
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: "Sorry, I'm having trouble processing your message. Please try again.",
            sender: "jarvis",
            timestamp: new Date()
          }
        ])
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          text: "Network error. Please check your connection and try again.",
          sender: "jarvis",
          timestamp: new Date()
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-xl text-gray-300">Loading your personal Jarvis assistant...</p>
      </div>
    );
  }

  // Check if token exists
  const token = getTokenFromUrl();
  if (!token) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-white mb-4">No Token Found</h2>
          <p className="text-gray-300 mb-6">This page requires a token for access.</p>
          <p className="text-gray-400 text-sm">Please access this page through your personal member link.</p>
        </div>
      </div>
    );
  }

  // Handle case where member data couldn't be loaded
  if (!memberData) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Member Not Found</h2>
          <p className="text-gray-300 mb-6">Could not load member data. Invalid or expired token.</p>
          <p className="text-gray-400 text-sm">Please check your link or contact your team admin.</p>
        </div>
      </div>
    );
  }

  const displayName = memberData?.name || 'Team Member';
  const displayRole = memberData?.role || 'Team Member';

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">J</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Agrimater Assistant</h1>
            <p className="text-sm text-gray-400">Project Support for {displayName} ({displayRole})</p>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Agrimater Online</span>
          </div>
        </div>
      </motion.div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${message.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
                  : 'bg-gray-700/50 text-gray-100 rounded-bl-md'
                  }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'order-1 ml-2' : 'order-2 mr-2'}`}>
              {message.sender === 'user' ? (
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{(displayName || 'TM')[0]}</span>
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">J</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 order-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">J</span>
              </div>
            </div>
            <div className="max-w-xs lg:max-w-md xl:max-w-lg order-1">
              <div className="px-4 py-3 rounded-2xl bg-gray-700/50 text-gray-100 rounded-bl-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-gray-700 p-4 bg-gray-800/30 backdrop-blur-sm"
      >
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Message Jarvis..."
            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Agrimater AI is connected to the project's shared memory and progress tracker
        </p>
      </motion.div>
    </div>
  );
};

export default MemberChatInterface;