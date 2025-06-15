'use client';

import { useState } from 'react';

export function DevFooter() {
  const [showInfo, setShowInfo] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Development Mode</span>
            <span className="text-xs text-gray-500">Internal Tooling</span>
          </div>
          
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showInfo ? 'Hide Info' : 'Show Info'}
          </button>
        </div>
        
        {showInfo && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>⚠️ Developer Notice:</strong> This page is for internal development and testing only.
            It will automatically redirect to the dashboard in production environments.
            <div className="mt-2 space-y-1">
              <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
              <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</div>
              <div><strong>Protected:</strong> Yes (middleware + component-level)</div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
} 