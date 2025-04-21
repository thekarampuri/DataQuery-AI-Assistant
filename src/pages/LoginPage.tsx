import React from 'react';
import { Navigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import { useAuth } from '../hooks/useAuth';

interface LoginPageProps {
  darkMode: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ darkMode }) => {
  const { user, loading } = useAuth();

  // If auth is still loading, show nothing or a loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If user is already authenticated, redirect to home
  if (user) {
    return <Navigate to="/home" replace />;
  }

  // Show landing page with authentication options
  return (
    <LandingPage 
      darkMode={darkMode} 
    />
  );
};

export default LoginPage; 