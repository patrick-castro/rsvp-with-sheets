import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Admin from '@/pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/rsvp' replace />} />
        <Route path='/rsvp' element={<Home />} />
        <Route path='/admin' element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
