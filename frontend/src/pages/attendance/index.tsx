import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout'; 

interface Attendance {
  id: number;
  employeeId: number;
  employee: {
    name: string;
  };
  checkIn: string;
  checkOut: string | null;
  date: string;
}

const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/attendance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
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
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmployee || !checkInTime) {
      toast({
        title: 'Error',
        description: 'Please select an employee and enter a check-in time.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/attendance/check-in',
        { employeeId: selectedEmployee, checkIn: new Date(checkInTime).toISOString() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast({
        title: 'Success',
        description: 'Check-in recorded successfully.',
      });
      fetchAttendance();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record check-in.',
        variant: 'destructive',
      });
      console.error('Error recording check-in:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee || !checkOutTime) {
      toast({
        title: 'Error',
        description: 'Please select an employee and enter a check-out time.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/attendance/check-out',
        { employeeId: selectedEmployee, checkOut: new Date(checkOutTime).toISOString() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast({
        title: 'Success',
        description: 'Check-out recorded successfully.',
      });
      fetchAttendance();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record check-out.',
        variant: 'destructive',
      });
      console.error('Error recording check-out:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Attendance Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select onValueChange={(value) => setSelectedEmployee(parseInt(value))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                placeholder="Check-in Time"
              />
              <Button onClick={handleCheckIn}>Check In</Button>
            </div>
            <div className="flex items-center gap-4">
              <Select onValueChange={(value) => setSelectedEmployee(parseInt(value))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                placeholder="Check-out Time"
              />
              <Button onClick={handleCheckOut}>Check Out</Button>
            </div>
          </div>
          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.employee.name}</TableCell>
                  <TableCell>{new Date(record.checkIn).toLocaleString()}</TableCell>
                  <TableCell>{record.checkOut ? new Date(record.checkOut).toLocaleString() : 'Not checked out'}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
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
    <AttendancePage />
    </DashboardLayout>
  </ProtectedRoute>
);