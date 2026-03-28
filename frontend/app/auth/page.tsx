'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import Alert from '@/components/Alert';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import { 
  registerWithEmail, 
  signInWithEmail, 
  signInWithGoogle, 
  signInWithGithub 
} from '@/lib/firebaseAuth';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    institution: '',
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      
      if (isLogin) {
        // Backend login to get JWT token
        response = await apiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
        
        if (response?.token) {
          localStorage.setItem('authToken', response.token);
        }
      } else {
        // Backend register to get JWT token
        response = await apiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            institution: formData.institution,
          }),
        });
        
        if (response?.token) {
          localStorage.setItem('authToken', response.token);
        }
      }
      
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('Google sign-in is currently disabled. Please use email/password authentication.');
  };

  const handleGithubSignIn = async () => {
    setError('GitHub sign-in is currently disabled. Please use email/password authentication.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">
          {isLogin ? '🔐 Login' : '📝 Register'}
        </h1>
        <p className="text-center text-gray-600 mb-6">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Institution</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Your institution"
                  className="input-field w-full"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field w-full"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </Button>
        </form>

        {isLogin && (
          <>
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <span className="text-lg">🔍</span>
                <span className="ml-2 text-sm font-medium">Google</span>
              </button>

              <button
                type="button"
                onClick={handleGithubSignIn}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <span className="text-lg">🐙</span>
                <span className="ml-2 text-sm font-medium">GitHub</span>
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
