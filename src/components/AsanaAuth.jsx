"use client";

import React, { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';

const AsanaAuth = ({ onAuthComplete }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const CLIENT_ID = process.env.NEXT_PUBLIC_ASANA_CLIENT_ID;
  const REDIRECT_URI = 'https://asana-tasks-to-pdf.vercel.app/auth/callback';

  useEffect(() => {
    // Check if we have an access token in localStorage
    const token = localStorage.getItem('asana_access_token');
    if (token) {
      console.log('Found existing token');
      setIsAuthenticated(true);
      onAuthComplete(token);
      return;
    }

    // Check for authorization code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      exchangeCodeForToken(code);
      return;
    }

    // Check for errors in URL
    const error = urlParams.get('error');
    if (error) {
      console.error('Auth error:', error);
      setAuthError(`Authentication error: ${error}`);
    }
  }, [onAuthComplete, CLIENT_ID]);

  const initiateAuth = () => {
    if (!CLIENT_ID) {
      setAuthError('Client ID is not configured. Please check your environment variables.');
      return;
    }

    const scope = 'default';
    const authUrl = `https://app.asana.com/-/oauth_authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  };

  const exchangeCodeForToken = async (code) => {
    try {
      const response = await fetch('/api/auth/asana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('asana_access_token', data.access_token);
        setIsAuthenticated(true);
        onAuthComplete(data.access_token);
      } else {
        setAuthError('Failed to get access token');
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      setAuthError('Authentication failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Asana Authentication</h2>
      </div>
      <div>
        {!isAuthenticated ? (
          <>
            <button
              onClick={initiateAuth}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Connect with Asana
            </button>
            {authError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {authError}
              </div>
            )}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm">
                <p>Debug Info:</p>
                <p>Client ID: {CLIENT_ID ? 'Set' : 'Not Set'}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-green-600 font-medium flex items-center gap-2">
            <span>✓</span> Connected to Asana
          </div>
        )}
      </div>
    </div>
  );
};

export default AsanaAuth;