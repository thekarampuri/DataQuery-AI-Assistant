import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft, X, Eye, EyeOff, Database } from 'lucide-react';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

interface AuthProps {
  darkMode: boolean;
  onClose: () => void;
  initialMode: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ darkMode, onClose, initialMode }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const validateSignupForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
        navigate('/home');
      } else {
        if (!validateSignupForm()) {
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: `${firstName} ${lastName}`
        });
        onClose();
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
      navigate('/home');
    } catch (err: any) {
      let errorMessage = 'Google sign-in failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInAnonymously(auth);
      onClose();
      navigate('/home');
    } catch (err: any) {
      setError('Anonymous sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} font-['Inter', system-ui, sans-serif]`}>
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left side - Form */}
        <div className={`w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center`}>
          <div className="max-w-md mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {mode === 'login' ? 'Welcome back!' : 'Create account'}
              </h1>
              <button
                onClick={onClose}
                className={`p-2 rounded-full ${
                  darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className={`text-base sm:text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {mode === 'login' 
                ? 'Sign in to continue to DataQuery AI Assistant' 
                : 'Join us to start analyzing your data with ease'}
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-base">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-base font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`w-full pl-10 px-4 py-3 rounded-lg border text-base ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                        placeholder="First Name"
                        required
                      />
                      <User className={`absolute left-3 top-3 h-5 w-5 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-base font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Last Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`w-full pl-10 px-4 py-3 rounded-lg border text-base ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                        placeholder="Last Name"
                        required
                      />
                      <User className={`absolute left-3 top-3 h-5 w-5 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-base font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 px-4 py-3 rounded-lg border text-base ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    placeholder="Email address"
                    required
                  />
                  <Mail className={`absolute left-3 top-3 h-5 w-5 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
              </div>

              <div>
                <label className={`block text-base font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 px-4 py-3 rounded-lg border text-base ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    placeholder="Password"
                    required
                  />
                  <Lock className={`absolute left-3 top-3 h-5 w-5 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    {showPassword ? (
                      <EyeOff className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    ) : (
                      <Eye className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className={`block text-base font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 px-4 py-3 rounded-lg border text-base ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      placeholder="Confirm password"
                      required
                    />
                    <Lock className={`absolute left-3 top-3 h-5 w-5 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      ) : (
                        <Eye className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <a 
                    href="#" 
                    className={`text-base font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
                  >
                    Forgot Password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center px-4 py-3.5 rounded-lg text-white ${
                  loading 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } font-medium transition-colors text-base sm:text-lg`}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  mode === 'login' ? <LogIn className="mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />
                )}
                {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>

              <div className="relative flex items-center py-3">
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
                <span className={`flex-shrink px-4 text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>or continue with</span>
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
              </div>

              <div className="flex justify-center">
                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  className={`flex items-center justify-center p-3 px-5 rounded-lg ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                  } border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors`}
                >
                  <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24">
                    <path
                      fill={darkMode ? '#fff' : '#000'}
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#4285F4"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-base">{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </button>
              </div>

              <div className="text-center mt-6">
                <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {mode === 'login' ? 'Not a member? ' : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      handleReset();
                    }}
                    className={`font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
                  >
                    {mode === 'login' ? 'Register now' : 'Sign in'}
                  </button>
                </p>
              </div>

              
            </form>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className={`hidden lg:flex lg:w-1/2 items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-blue-50'}`}>
          <div className="max-w-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <Database className={`h-14 w-14 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Make your work easier and organized with DataQuery AI Assistant
            </h2>
            <div className="mt-8 flex justify-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
              }`}>
                <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                <span>10 NEW FEATURES</span>
              </div>
            </div>
            <div className="mt-12">
              <img
                src="https://illustrations.popsy.co/green/woman-meditating.svg"
                alt="Illustration"
                className="max-w-xs mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 