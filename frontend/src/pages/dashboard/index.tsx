import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Calendar, Clock, TrendingUp, LucideIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from '@/components/DashboardLayout'; 
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// API response interfaces
interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  departmentId: number;
  department: {
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface Leave {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  employee: {
    name: string;
  };
}

interface Attendance {
  id: number;
  employeeId: number;
  checkIn: string;
  checkOut?: string;
  employee: {
    name: string;
  };
}

interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  pendingLeaves: number;
  presentToday: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  isLoading?: boolean;
}

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// API service
const api = {
  async fetch<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('token');
      // Remove the /api prefix since your backend routes don't include it
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.error || 'API request failed');
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'An unknown error occurred';
      return { data: null as unknown as T, error: errorMessage };
    }
  }
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, isLoading = false }) => (
  <Card className="bg-white">
    <CardContent className="p-6 flex items-center justify-between">
      {isLoading ? (
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
          </div>
          <div className={`p-4 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </>
      )}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const COLORS: string[] = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all required data in parallel
      const [
        employeesRes,
        departmentsRes,
        leavesRes,
        attendanceRes
      ] = await Promise.all([
        api.fetch<Employee[]>('/employees'),
        api.fetch<Department[]>('/departments'),
        api.fetch<Leave[]>('/leaves'),
        api.fetch<Attendance[]>('/attendance')
      ]);

      // Check for any errors
      const errors = [employeesRes.error, departmentsRes.error, leavesRes.error, attendanceRes.error]
        .filter(Boolean);
      if (errors.length > 0) {
        throw new Error(errors[0]);
      }

      // Process and set the data
      setEmployees(employeesRes.data);
      setDepartments(departmentsRes.data);
      setRecentLeaves(leavesRes.data.slice(0, 5)); // Only show 5 most recent

      // Calculate stats
      const pendingLeaves = leavesRes.data.filter(leave => leave.status === 'pending').length;
      const presentToday = attendanceRes.data.filter(att => 
        new Date(att.checkIn).toDateString() === new Date().toDateString()
      ).length;

      setStats({
        totalEmployees: employeesRes.data.length,
        totalDepartments: departmentsRes.data.length,
        pendingLeaves,
        presentToday
      });

      // Process attendance data for chart
      const processedAttendance = processAttendanceData(attendanceRes.data);
      setAttendanceData(processedAttendance);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const processAttendanceData = (data: Attendance[]) => {
    // Process last 5 days attendance
    const last5Days = [...Array(5)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last5Days.map(date => ({
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      present: data.filter(att => att.checkIn.startsWith(date)).length
    }));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getDepartmentDistribution = () => {
    if (!employees.length || !departments.length) return [];
    
    return departments.map(dept => ({
      name: dept.name,
      value: employees.filter(emp => emp.departmentId === dept.id).length
    }));
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading dashboard: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-2">Welcome back, Admin</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees ?? 0}
            icon={Users}
            color="bg-blue-500"
            isLoading={isLoading}
          />
          <StatCard
            title="Departments"
            value={stats?.totalDepartments ?? 0}
            icon={Briefcase}
            color="bg-green-500"
            isLoading={isLoading}
          />
          <StatCard
            title="Pending Leaves"
            value={stats?.pendingLeaves ?? 0}
            icon={Calendar}
            color="bg-yellow-500"
            isLoading={isLoading}
          />
          <StatCard
            title="Present Today"
            value={stats?.presentToday ?? 0}
            icon={Clock}
            color="bg-purple-500"
            isLoading={isLoading}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Attendance Trend */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Weekly Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="present" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Department Distribution */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getDepartmentDistribution()}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {getDepartmentDistribution().map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : (
                recentLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {leave.employee.name} requested {leave.type} leave
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <DashboardLayout>
    <Dashboard />
    </DashboardLayout>
  </ProtectedRoute>
);