import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, UserPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  email: z.string().email("Invalid email address")
});

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ 
    username?: string; 
    password?: string; 
    email?: string;
  }>({});
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');

    try {
      const validatedData = registerSchema.parse({ username, password, email });
      await axios.post('/api/register', validatedData);
      router.push('/login?success=Registration successful! Please login');
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
          case 409:
            setFormError('Username already exists');
            break;
          case 400:
            setFormError('Invalid registration data');
            break;
          default:
            setFormError(error.response?.data?.error || 'Registration failed');
        }
      } else {
        setFormError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="hidden md:flex items-center justify-center bg-green-50 p-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 400 300" 
            className="max-w-full h-auto"
          >
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#047857" stopOpacity="0.9"/>
              </linearGradient>
            </defs>
            
            {/* Registration Illustration */}
            <rect x="100" y="50" width="200" height="150" rx="10" fill="url(#greenGradient)" />
            
            <circle cx="200" cy="125" r="40" fill="#D1FAE5" />
            <path 
              d="M200 105 L210 125 L190 125 Z" 
              fill="#059669" 
            />
            
            <rect x="150" y="170" width="100" height="10" rx="5" fill="#6EE7B7" />
            
            <path 
              d="M180 200 Q200 230, 220 200" 
              fill="none" 
              stroke="#059669" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
          </svg>
        </div>

        <Card className="w-full shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Create Your Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
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
                <div className="text-sm text-gray-600">
                  Password requirements:
                  <ul className="list-disc pl-4 mt-1">
                    <li>At least 6 characters</li>
                    <li>One uppercase letter</li>
                    <li>One number</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white"
              >
                Register
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;