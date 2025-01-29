import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  CalendarDays,
  LogOut,
  Menu,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: router.pathname === '/dashboard',
    },
    {
      name: 'Employees',
      href: '/employees',
      icon: Users,
      current: router.pathname.startsWith('/employees'),
    },
    {
      name: 'Departments',
      href: '/departments',
      icon: Building2,
      current: router.pathname.startsWith('/departments'),
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: ClipboardCheck,
      current: router.pathname.startsWith('/attendance'),
    },
    {
      name: 'Leave Management',
      href: '/leaves',
      icon: CalendarDays,
      current: router.pathname.startsWith('/leaves'),
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="lg:hidden p-2 fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
          <div className="flex h-16 flex-shrink-0 items-center bg-gray-900 px-4 justify-between">
            <div className="overflow-hidden whitespace-nowrap">
              <h1 
                className={`text-xl font-bold text-white transition-all duration-300 ease-in-out ${
                  isSidebarCollapsed 
                    ? 'opacity-0 -translate-x-8' 
                    : 'opacity-100 translate-x-0'
                }`}
              >
                EMS Dashboard
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 transition-transform duration-300" />
              ) : (
                <ChevronLeft className="h-5 w-5 transition-transform duration-300" />
              )}
            </Button>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-md relative
                    ${item.current
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className={`h-5 w-5 transition-all duration-300 ease-in-out ${
                    isSidebarCollapsed ? 'mr-0' : 'mr-3'
                  }`} />
                  <span className={`whitespace-nowrap transition-all duration-300 ease-in-out absolute left-12 ${
                    isSidebarCollapsed 
                      ? 'opacity-0 -translate-x-8 overflow-hidden w-0'
                      : 'opacity-100 translate-x-0 overflow-visible w-auto'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>
            <div className="flex-shrink-0 border-t border-gray-800 p-4">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center text-gray-300 hover:bg-gray-700 hover:text-white relative"
                onClick={handleLogout}
                title={isSidebarCollapsed ? 'Logout' : undefined}
              >
                <LogOut className={`h-5 w-5 transition-all duration-300 ease-in-out ${
                  isSidebarCollapsed ? 'mr-0' : 'mr-2'
                }`} />
                <span className={`whitespace-nowrap transition-all duration-300 ease-in-out absolute left-12 ${
                  isSidebarCollapsed 
                    ? 'opacity-0 -translate-x-8 overflow-hidden w-0'
                    : 'opacity-100 translate-x-0 overflow-visible w-auto'
                }`}>
                  Logout
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        } flex flex-col flex-1`}
      >
        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;