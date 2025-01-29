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
import DashboardLayout from '@/components/DashboardLayout'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const employeeSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  position: z.string().min(2, { message: 'Position must be at least 2 characters' }),
  departmentId: z.number().min(1, { message: 'Department is required' }),
  salary: z.coerce.number().min(0, { message: 'Salary must be a positive number' }),
  joiningDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
});

const AddEmployee: React.FC = () => {
  const router = useRouter();
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      position: '',
      departmentId: 0,
      salary: 0,
      joiningDate: '',
    },
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/departments', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const onSubmit = async (data: z.infer<typeof employeeSchema>) => {
    try {
      const token = localStorage.getItem('token');
      const formattedData = {
        ...data,
        joiningDate: data.joiningDate.split('T')[0], // Format the date
      };
      await axios.post('http://localhost:5000/employees', formattedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Employee Added',
        description: `${data.name} has been successfully added.`,
      });
      router.push('/employees');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add employee. Please try again.',
        variant: 'destructive',
      });
      console.error('Error adding employee:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/employees" className="mb-4 inline-flex items-center">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </Link>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add New Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="name"
                {...form.register('name')}
                className={`mt-1 ${form.formState.errors.name ? 'border-red-500' : ''}`}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.name.message as string}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                className={`mt-1 ${form.formState.errors.email ? 'border-red-500' : ''}`}
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message as string}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                Position
              </label>
              <Input
                id="position"
                {...form.register('position')}
                className={`mt-1 ${form.formState.errors.position ? 'border-red-500' : ''}`}
              />
              {form.formState.errors.position && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.position.message as string}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <Select
                onValueChange={(value) => form.setValue('departmentId', parseInt(value))}
                defaultValue={form.watch('departmentId')?.toString()}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.departmentId && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.departmentId.message as string}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                Salary
              </label>
              <Input
                id="salary"
                type="number"
                {...form.register('salary')}
                className={`mt-1 ${form.formState.errors.salary ? 'border-red-500' : ''}`}
              />
              {form.formState.errors.salary && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.salary.message as string}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700">
                Joining Date
              </label>
              <Input
                id="joiningDate"
                type="date"
                {...form.register('joiningDate')}
                className={`mt-1 ${form.formState.errors.joiningDate ? 'border-red-500' : ''}`}
              />
              {form.formState.errors.joiningDate && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.joiningDate.message as string}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Add Employee
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
    <AddEmployee />
    </DashboardLayout>
  </ProtectedRoute>
);