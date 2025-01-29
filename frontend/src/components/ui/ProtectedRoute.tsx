import { useEffect } from 'react';
import { useRouter } from 'next/router';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login'); // Redirect to login if no token
    } else {
      // Decode the token to check the user's role
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      if (!allowedRoles.includes(decodedToken.role)) {
        router.push('/unauthorized'); // Redirect if role is not allowed
      }
    }
  }, [router, allowedRoles]);

  return <>{children}</>;
};

export default ProtectedRoute;