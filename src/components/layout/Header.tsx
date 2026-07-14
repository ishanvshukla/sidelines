import { useState, useRef, useEffect } from 'react';
import { SPORT_MAP } from '../../constants/sports';
import { useAuth } from '../../contexts/AuthContext';
import SportIcon from '../ui/SportIcon';
import type { SportId } from '../../types/news';

interface Props {
  activeFilter: string;
  onFilter: (id: string) => void;
  selectedSports: SportId[];
  onEditSports: () => void;
  onSignIn: () => void;
}

export default function Header({ activeFilter, onFilter, selectedSports, onEditSports, onSignIn }: Props) {
  const { isLoggedIn, email, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sports = selectedSports.map((id) => SPORT_MAP[id]).filter(Boolean);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-espn-nav border-b border-espn-border backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="font-display font-black italic text-2xl text-white tracking-wide uppercase">
            Side<span className="text-gold">lines</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          <button
            onClick={() => onFilter('all')}
            className={`px-4 py-2 font-body font-medium uppercase text-sm tracking-[0.08em] transition-colors ${
              activeFilter === 'all'
                ? 'text-gold border-b-2 border-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => onFilter(sport.id)}
              className={`flex items-center gap-1.5 px-3 py-2 font-body font-medium uppercase text-sm tracking-[0.08em] transition-colors ${
                activeFilter === sport.id ? 'border-b-2' : 'text-gray-400 hover:text-gray-200'
              }`}
              style={activeFilter === sport.id ? { color: sport.color, borderColor: sport.color } : {}}
            >
              <SportIcon sportId={sport.id} size={14} />
              {sport.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Edit button */}
          <button
            onClick={onEditSports}
            title="Edit preferences"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded border border-espn-border text-gray-500 hover:text-gold hover:border-gold-dim transition-colors font-oswald text-xs uppercase tracking-widest"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Edit
          </button>

          {/* Auth button */}
          {isLoggedIn ? (
            <div ref={userMenuRef} className="hidden md:block relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-espn-border text-gray-400 hover:text-gold hover:border-gold-dim transition-colors font-inter text-xs"
              >
                <span className="w-5 h-5 rounded-full bg-gold flex items-center justify-center text-black text-xs font-oswald font-bold">
                  {email?.[0]?.toUpperCase() ?? '?'}
                </span>
                <span className="max-w-[110px] truncate">{email}</span>
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-espn-card border border-espn-border rounded-lg shadow-2xl overflow-hidden">
                  <button
                    onClick={() => { onEditSports(); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-inter text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Edit preferences
                  </button>
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-inter text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors border-t border-espn-border"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded bg-gold text-black font-oswald text-xs uppercase tracking-widest hover:bg-gold-bright transition-colors"
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-400 hover:text-white p-2 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-px bg-current mb-1.5" />
            <div className="w-5 h-px bg-current mb-1.5" />
            <div className="w-4 h-px bg-current" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-espn-nav border-t border-espn-border px-4 py-3 flex flex-col gap-1">
          <button
            onClick={() => { onFilter('all'); setMenuOpen(false); }}
            className="text-left py-2 font-body font-medium uppercase text-sm tracking-widest text-gray-400 hover:text-white"
          >
            All Sports
          </button>
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => { onFilter(sport.id); setMenuOpen(false); }}
              className="flex items-center gap-2 text-left py-2 font-body font-medium uppercase text-sm tracking-widest"
              style={{ color: sport.color }}
            >
              <SportIcon sportId={sport.id} size={14} />
              {sport.label}
            </button>
          ))}
          <div className="border-t border-espn-border mt-2 pt-3 flex flex-col gap-1">
            <button
              onClick={() => { onEditSports(); setMenuOpen(false); }}
              className="text-left py-2 font-body font-medium uppercase text-sm tracking-widest text-gray-500 hover:text-gold"
            >
              Edit Sports
            </button>
            {isLoggedIn ? (
              <>
                <p className="py-1 text-xs font-inter text-gray-600 truncate">{email}</p>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="text-left py-2 font-body font-medium uppercase text-sm tracking-widest text-red-500 hover:text-red-400"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { onSignIn(); setMenuOpen(false); }}
                className="text-left py-2 font-body font-medium uppercase text-sm tracking-widest text-gold hover:text-gold-bright"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
