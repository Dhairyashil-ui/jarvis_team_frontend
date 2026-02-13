import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import ManagerDashboard from './components/ManagerDashboard';
import MemberChatInterface from './components/MemberChatInterface';
import { updateStoredTunnelUrl } from './utils/UrlUtils';

function AppContent() {
  // Update the stored tunnel URL when the app loads
  useEffect(() => {
    updateStoredTunnelUrl();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Agrimater <span className="text-green-400">Company Dashboard</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Project Management System • Managed by Dhairyashil Shinde
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/member/:id" element={<MemberChatWrapper />} />
            <Route path="/chat" element={<TokenBasedChat />} />
            <Route path="/chat/:id" element={<MemberChatWrapper />} />
          </Routes>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 text-center text-gray-400"
        >
          <p>Agrimater Internal System • Secure Project Environment</p>
        </motion.footer>
      </div>
    </div>
  );
}

function MemberChatWrapper() {
  const { id } = useParams();

  return <MemberChatInterface memberId={id} />;
}

function TokenBasedChat() {
  // Extract token from URL query parameters
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Pass the token as memberId to maintain compatibility with existing component
  return <MemberChatInterface memberId={token} />;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;