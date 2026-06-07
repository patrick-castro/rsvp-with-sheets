import { useNavigate } from 'react-router-dom';

import { AdminLogin } from '@/components/AdminLogin';

export default function Login() {
  const navigate = useNavigate();

  return <AdminLogin onSuccess={() => navigate('/admin', { replace: true })} />;
}
