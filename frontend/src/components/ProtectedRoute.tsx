import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const ProtectedRoute = ({ children, allowedRoles }: { 
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyAuth = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const isExpired = decoded.exp * 1000 < Date.now();
        
        if (isExpired || !allowedRoles.includes(decoded.role)) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        
        setIsVerified(true);
      } catch (error) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    verifyAuth();
  }, [router, allowedRoles]);

  return isVerified ? <>{children}</> : null; // Return null until verification completes
};

export default ProtectedRoute;