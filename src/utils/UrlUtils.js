/**
 * Utility functions for dynamic URL handling in the Jarvis Hackathon Platform
 */

// Function to get the current API base URL
// Function to get the current API base URL
export const getApiBaseUrl = () => {
  // 1. Development (Localhost)
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:5002";
  }

  // 2. Production (Vercel)
  // If the backend is hosted on the same domain (e.g. via proxy), use origin.
  // But here we are hosting Frontend on Vercel and Backend on Render.
  return "https://jarvis-projectmanager.onrender.com";
};


// Function to get the current base URL for links
export const getCurrentBaseUrl = () => {
  return window.location.origin;
};

// Function to update the stored tunnel URL (kept for compatibility, but simplified)
export const updateStoredTunnelUrl = () => {
  return window.location.origin;
};

// Function to generate a member link with the current base URL
export const generateMemberLink = (token) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/chat?token=${token}`;
};

