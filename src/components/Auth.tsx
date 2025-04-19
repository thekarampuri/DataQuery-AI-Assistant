import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously
} from 'firebase/auth';

interface AuthProps {
  darkMode: boolean;
  onClose: () => void;
  initialMode: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ darkMode, onClose, initialMode }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      if (isLogin) {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Update user profile with name
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: formData.name
          });
        }
      }

      // Close the auth modal after successful authentication
      onClose();
    } catch (err: any) {
      // Handle Firebase Auth errors
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      let errorMessage = 'Google sign-in failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await signInAnonymously(auth);
      onClose();
    } catch (err: any) {
      setError('Anonymous sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full space-y-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 sm:p-8 rounded-xl shadow-lg`}>
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
          <div>
            <h2 className={`text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className={`font-medium ${
                  darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'
                }`}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {error && (
          <div className={`p-3 rounded-lg text-sm ${
            darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-600'
          }`}>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-2 border rounded-lg placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="John Doe"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <User className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 border rounded-lg placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-300 text-gray-900'
                  }`}
                  placeholder="you@example.com"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 border rounded-lg placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-300 text-gray-900'
                  }`}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Lock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-2 border rounded-lg placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Lock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLogin && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                className={`text-sm font-medium ${
                  darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'
                }`}
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {isLogin ? (
                      <LogIn className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                    ) : (
                      <UserPlus className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                    )}
                  </span>
                  {isLogin ? 'Sign in' : 'Sign up'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Social Sign-in Options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full inline-flex justify-center py-2 px-4 border text-sm font-medium rounded-lg ${
                darkMode
                  ? 'border-gray-700 bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={handleAnonymousSignIn}
              disabled={isLoading}
              className={`w-full inline-flex justify-center py-2 px-4 border text-sm font-medium rounded-lg ${
                darkMode
                  ? 'border-gray-700 bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User className="h-5 w-5 mr-2" />
              Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 