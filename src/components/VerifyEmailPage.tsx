import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent multiple verification attempts
      if (hasVerified.current) return;
      hasVerified.current = true;

      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      console.log('Attempting to verify with token:', token);

      try {
        const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
        console.log('Verification response:', response.data);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        console.error('Verification error:', error.response?.data);
        
        // Check if it's an "already verified" error - treat it as success
        const errorMsg = error.response?.data?.error || '';
        
        if (errorMsg.includes('already verified')) {
          setStatus('success');
          setMessage('Your email is already verified! You can log in now.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else if (errorMsg.includes('Invalid verification token')) {
          // Token was already used or doesn't exist
          setStatus('error');
          setMessage('This verification link has already been used or is invalid. If you just verified your email, you can log in now!');
        } else {
          setStatus('error');
          setMessage(
            errorMsg || 
            'Failed to verify email. Please try again or request a new verification link.'
          );
        }
      }
    };

    verifyEmail();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
              <p className="text-gray-400">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-500 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified! ✅</h2>
              <p className="text-gray-300 mb-4">{message}</p>
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
                <p className="text-green-300 text-sm font-semibold mb-2">🎉 Your account is now active!</p>
                <p className="text-gray-400 text-sm">You can now log in and access all features of ARC Raiders Companion.</p>
              </div>
              <p className="text-gray-400 text-sm">Redirecting to login page in 3 seconds...</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Go to Login Now
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-500 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-gray-300 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
