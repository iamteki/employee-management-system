import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout'; 

interface Department {
  id: number;
  name: string;
  description?: string;
}

const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchDepartments();
  }, []);

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

  // const handleDelete = async (id: number) => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     await axios.delete(`http://localhost:5000/departments/${id}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     fetchDepartments();
  //   } catch (error) {
  //     console.error('Error deleting department:', error);
  //   }
  // };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl font-bold">Departments</CardTitle>
          <Link href="/departments/add">
            <Button className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>{department.name}</TableCell>
                  <TableCell>{department.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/departments/edit/${department.id}`}>
                        <Button variant="outline" size="icon" className="text-primary hover:text-primary/80">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {/* <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(department.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <DashboardLayout>
    <DepartmentList />
    </DashboardLayout>
  </ProtectedRoute>
);