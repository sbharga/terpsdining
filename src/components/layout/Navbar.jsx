import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { supabase } from '../../api/supabase';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

const NAV_LINKS = [
  { to: '/',        label: 'Home',    end: true  },
  { to: '/search',  label: 'Search'              },
  { to: '/profile', label: 'Profile', authOnly: true },
];

const PILL = 'rounded-full border border-white/40 px-3 py-1 text-xs hover:bg-white/10 transition-colors';

export default function Navbar() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const visibleLinks = NAV_LINKS.filter((l) => !l.authOnly || user);

  return (
    <>
      <nav className="bg-primary text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight">
            TerpsDining
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-5 text-sm font-medium">
            {visibleLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => (isActive ? 'underline' : 'hover:underline')}
              >
                {label}
              </NavLink>
            ))}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-white/70 text-xs truncate max-w-[140px]">{user.email}</span>
                <button onClick={handleSignOut} className={PILL}>Sign Out</button>
              </div>
            ) : (
              <button data-sign-in onClick={() => setShowAuth(true)} className={PILL}>
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-white text-xl leading-none px-1"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden bg-primary border-t border-white/20 px-4 pb-3 space-y-2 text-sm font-medium text-white">
            {visibleLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `block py-1.5 ${isActive ? 'underline' : 'hover:underline'}`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}

            <div className="pt-1 border-t border-white/20">
              {user ? (
                <>
                  <p className="text-white/60 text-xs truncate mb-1">{user.email}</p>
                  <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className={PILL}>
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  data-sign-in
                  onClick={() => { setShowAuth(true); setMenuOpen(false); }}
                  className={PILL}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
