import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Trash2, Edit, PlusCircle, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import DashboardLayout from '@/components/DashboardLayout'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: {
    name: string;
  };
  salary: number;
  joiningDate: string;
}

interface Department {
  id: number;
  name: string;
}

const EmployeeManagementIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-8 w-8 text-primary mr-2 inline-block"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(5); // Number of items per page
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]); // For bulk actions

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    checkUserRole();
  }, []);

  const checkUserRole = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.role);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/employees', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to fetch employees. Please try again.');
    }
  };

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

  const handleDelete = async () => {
    if (deleteEmployeeId) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/employees/${deleteEmployeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchEmployees();
        setDeleteEmployeeId(null);
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Failed to delete employee. Please log in again.');
      }
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearchTerm =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment
      ? employee.department.name === selectedDepartment
      : true;

    return matchesSearchTerm && matchesDepartment;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Export data as CSV
  const handleExportData = () => {
    const headers = ['Name', 'Email', 'Position', 'Department', 'Salary', 'Joining Date'];
    const data = filteredEmployees.map((employee) => [
      employee.name,
      employee.email,
      employee.position,
      employee.department.name,
      employee.salary,
      new Date(employee.joiningDate).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'employees.csv';
    link.click();
  };

  // Example usage in handleBulkDelete
const handleBulkDelete = async () => {
  if (selectedEmployees.length === 0) return;

  try {
    const token = localStorage.getItem('token');
    await Promise.all(
      selectedEmployees.map((id) =>
        axios.delete(`http://localhost:5000/employees/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      )
    );
    fetchEmployees();
    setSelectedEmployees([]);
    toast.success('Selected employees have been deleted.'); // Success toast
  } catch (error) {
    toast.error('Failed to delete selected employees.'); // Error toast
    console.error('Error deleting employees:', error);
  }
};
  const handleSelectEmployee = (id: number) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((employeeId) => employeeId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pb-4">
          <div className="flex items-center">
            <EmployeeManagementIcon />
            <div>
              <CardTitle className="text-2xl font-bold text-primary">
                Employee Management
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                View and manage your team members
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
            >
              Logout
            </Button>
            {/* Only show the "Add Employee" button for admins */}
            {userRole === 'admin' && (
              <Link href="/employees/add">
                <Button className="bg-primary hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search employees by name, email, position, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2"
            />
            <Select onValueChange={(value) => setSelectedDepartment(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.name}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedEmployees.length > 0 && (
            <div className="mb-4">
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete Selected ({selectedEmployees.length})
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedEmployees.length === currentItems.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees(currentItems.map((employee) => employee.id));
                      } else {
                        setSelectedEmployees([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Joining Date</TableHead>
                {/* Only show the "Actions" column for admins */}
                {userRole === 'admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((employee) => {
                const departmentName = employee.department?.name || 'Unassigned'; // Default value
                return (
                  <TableRow key={employee.id} className="hover:bg-secondary/50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleSelectEmployee(employee.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-sm">{employee.position}</Badge>
                    </TableCell>
                    <TableCell>{departmentName}</TableCell>
                    <TableCell>${employee.salary.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(employee.joiningDate).toLocaleDateString()}
                    </TableCell>
                    {/* Only show the Edit/Delete buttons for admins */}
                    {userRole === 'admin' && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/employees/edit/${employee.id}`}>
                            <Button variant="outline" size="icon" className="text-primary hover:text-primary/80">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => setDeleteEmployeeId(employee.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                                <DialogDescription>
                                  This action cannot be undone. This will permanently delete
                                  the employee record from the system.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end space-x-2">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={handleDelete}
                                >
                                  Delete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default () => (
  <ProtectedRoute allowedRoles={['admin', 'employee']}>
   <DashboardLayout>
      <EmployeeList />
    </DashboardLayout>
  </ProtectedRoute>
);