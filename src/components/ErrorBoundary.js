"use client";

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Отправляем ошибку в аналитику (если есть)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-white text-xl font-bold mb-4">
              Something went wrong
            </h2>
            <p className="text-white/70 mb-6">
              Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
