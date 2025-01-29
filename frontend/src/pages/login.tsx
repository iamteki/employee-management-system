import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');

    try {
      loginSchema.parse({ username, password });
      const response = await axios.post('/api/login', { username, password });
      localStorage.setItem('token', response.data.token);
      router.push('/employees');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = error.errors.reduce((acc: Record<string, string>, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
        return setErrors(newErrors);
      }

      if (axios.isAxiosError(error)) {
        const backendErrors = error.response?.data?.details || [];
        const errorMap = (backendErrors as Array<{ field: string; message: string }>).reduce(
          (acc: Record<string, string>, curr) => {
            acc[curr.field] = curr.message;
            return acc;
          }, 
          {}
        );

        setErrors(errorMap);
        
        switch (error.response?.status) {
          case 401:
            setFormError('Invalid username or password');
            break;
          case 404:
            setFormError('User not found');
            break;
          default:
            setFormError(error.response?.data?.error || 'Login failed. Please try again.');
        }
      } else {
        setFormError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="hidden md:flex items-center justify-center bg-blue-50 p-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 400 300" 
            className="max-w-full h-auto"
          >
          <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.9"/>
              </linearGradient>
            </defs>
            
            {/* Computer/Login Illustration */}
            <rect x="100" y="50" width="200" height="150" rx="10" fill="url(#blueGradient)" />
            <rect x="120" y="70" width="160" height="110" fill="white" />
            
            <circle cx="200" cy="125" r="30" fill="#E0E7FF" />
            <path 
              d="M200 95 L210 115 L190 115 Z" 
              fill="#6366F1" 
            />
            
            <rect x="150" y="170" width="100" height="10" rx="5" fill="#A5B4FC" />
            
            <path 
              d="M150 200 Q200 230, 250 200" 
              fill="none" 
              stroke="#6366F1" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
          </svg>
        </div>

        <Card className="w-full shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Welcome Back
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors(prev => ({ ...prev, username: '' }));
                    }}
                    className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-sm">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;