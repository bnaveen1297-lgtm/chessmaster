import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { AppShell } from '@/components/AppShell';
import { Landing } from '@/screens/Landing';
import { Home } from '@/screens/Home';
import { PlayHub } from '@/screens/PlayHub';
import { PlayComputer } from '@/screens/PlayComputer';
import { PlayLocal } from '@/screens/PlayLocal';
import { Learn } from '@/screens/Learn';
import { Lesson } from '@/screens/Lesson';
import { Puzzles } from '@/screens/Puzzles';
import { Masters } from '@/screens/Masters';
import { MasterGame } from '@/screens/MasterGame';
import { Olympiad } from '@/screens/Olympiad';
import { Tournaments } from '@/screens/Tournaments';
import { Analyze } from '@/screens/Analyze';
import { Profile } from '@/screens/Profile';

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-plaster">
      <div className="animate-pulse font-display text-2xl font-black text-teal-deep">♚ ChessMaster</div>
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/app/play" element={<RequireAuth><PlayHub /></RequireAuth>} />
      <Route path="/app/play/computer" element={<RequireAuth><PlayComputer /></RequireAuth>} />
      <Route path="/app/play/local" element={<RequireAuth><PlayLocal /></RequireAuth>} />
      <Route path="/app/learn" element={<RequireAuth><Learn /></RequireAuth>} />
      <Route path="/app/learn/:id" element={<RequireAuth><Lesson /></RequireAuth>} />
      <Route path="/app/puzzles" element={<RequireAuth><Puzzles /></RequireAuth>} />
      <Route path="/app/masters" element={<RequireAuth><Masters /></RequireAuth>} />
      <Route path="/app/masters/:id" element={<RequireAuth><MasterGame /></RequireAuth>} />
      <Route path="/app/olympiad" element={<RequireAuth><Olympiad /></RequireAuth>} />
      <Route path="/app/tournaments" element={<RequireAuth><Tournaments /></RequireAuth>} />
      <Route path="/app/analyze" element={<RequireAuth><Analyze /></RequireAuth>} />
      <Route path="/app/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
