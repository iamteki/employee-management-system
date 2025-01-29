import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { PlusCircle, Search, CheckCircle, XCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout'; 

interface Leave {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason: string;
  adminNote?: string;
  employee: {
    name: string;
    department: {
      name: string;
    };
  };
}

const ViewLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUserRole();
    fetchLeaves();
  }, []);

  const checkUserRole = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.role);
    }
  };

// In index.tsx, modify the fetchLeaves function
const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/leaves', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLeaves(response.data);
    } catch (error: unknown) {
      // Check if the error is an AxiosError
      if (axios.isAxiosError(error)) {
        console.error('Error fetching leaves:', error);
        toast.error(error.response?.data?.error || 'Failed to fetch leave requests');
        if (error.response?.status === 401) {
          // Handle unauthorized access
          router.push('/login');
        }
      } else {
        // If the error is not an AxiosError, log a generic message
        console.error('An unexpected error occurred:', error);
        toast.error('An unexpected error occurred');
      }
    }
  };
  

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/leaves/${id}`,
        {
          status,
          adminNote,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(`Leave request ${status}`);
      setIsDialogOpen(false);
      setSelectedLeave(null);
      setAdminNote('');
      fetchLeaves();
    } catch (error) {
      console.error('Error updating leave status:', error);
      toast.error('Failed to update leave status');
    }
  };

  const filteredLeaves = leaves.filter(
    (leave) =>
      leave.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Leave Requests</CardTitle>
            <CardDescription>Manage employee leave requests</CardDescription>
          </div>
          <div className="flex gap-4">
            <Link href="/leaves/add">
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                New Request
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by employee, type, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                {userRole === 'admin' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>{leave.employee.name}</TableCell>
                  <TableCell>{leave.employee.department.name}</TableCell>
                  <TableCell className="capitalize">{leave.type}</TableCell>
                  <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        leave.status
                      )}`}
                    >
                      {leave.status}
                    </span>
                  </TableCell>
                  <TableCell>{leave.reason}</TableCell>
                  {userRole === 'admin' && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setIsDialogOpen(true);
                          }}
                          disabled={leave.status !== 'pending'}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setIsDialogOpen(true);
                          }}
                          disabled={leave.status !== 'pending'}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Leave Status</DialogTitle>
            <DialogDescription>
              Add a note and confirm the status update
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Note</label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note about your decision (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedLeave(null);
                setAdminNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => selectedLeave && handleUpdateStatus(selectedLeave.id, 'approved')}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLeave && handleUpdateStatus(selectedLeave.id, 'rejected')}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default () => (
  <ProtectedRoute allowedRoles={['admin', 'employee']}>
    <DashboardLayout>
    <ViewLeaves />
    </DashboardLayout>
  </ProtectedRoute>
);