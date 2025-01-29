import React, { useEffect, useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout'; 

const departmentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional(),
});

const EditDepartment: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
  });

  useEffect(() => {
    const fetchDepartment = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/departments/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const department = response.data;
        setValue('name', department.name);
        setValue('description', department.description);
        setIsLoading(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch department details.',
          variant: 'destructive',
        });
        console.error('Error fetching department:', error);
        setIsLoading(false);
      }
    };
    fetchDepartment();
  }, [id, setValue]);

  const onSubmit = async (data: z.infer<typeof departmentSchema>) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/departments/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Department Updated',
        description: `${data.name} has been successfully updated.`,
      });
      router.push('/departments');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update department. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating department:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          <CardTitle className="text-2xl font-bold">Edit Department</CardTitle>
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
              Update Department
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
    <EditDepartment />
    </DashboardLayout>
  </ProtectedRoute>
);