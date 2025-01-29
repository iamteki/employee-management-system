import React from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout'; 


const departmentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional(),
});

const AddDepartment: React.FC = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
  });

  const onSubmit = async (data: z.infer<typeof departmentSchema>) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/departments', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Department Added',
        description: `${data.name} has been successfully added.`,
      });
      router.push('/departments');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add department. Please try again.',
        variant: 'destructive',
      });
      console.error('Error adding department:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/departments" className="mb-4 inline-flex items-center">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Departments
        </Button>
      </Link>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add New Department</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="name"
                {...register('name')}
                className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <Input
                id="description"
                {...register('description')}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full">
              Add Department
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <DashboardLayout>
    <AddDepartment />
    </DashboardLayout>
  </ProtectedRoute>
);