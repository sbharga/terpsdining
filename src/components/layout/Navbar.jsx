import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { supabase } from '../../api/supabase';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

export default function Navbar() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const navLink = ({ isActive }) => (isActive ? 'underline' : 'hover:underline');

  return (
    <>
      <nav className="bg-[#E21833] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight">
            TerpsDining
          </Link>

          <div className="flex items-center gap-5 text-sm font-medium">
            <NavLink to="/" end className={navLink}>
              Home
            </NavLink>
            <NavLink to="/search" className={navLink}>
              Search
            </NavLink>
            {user && (
              <NavLink to="/profile" className={navLink}>
                Profile
              </NavLink>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-white/70 text-xs hidden sm:block truncate max-w-[140px]">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-white/40 px-3 py-1 text-xs hover:bg-white/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                data-sign-in
                onClick={() => setShowAuth(true)}
                className="rounded-full border border-white/40 px-3 py-1 text-xs hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
