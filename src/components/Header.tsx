import React, { useEffect, useState } from 'react';
import { TrendingUp, LogIn, LogOut, CloudCheck } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '../utils/firebase';

export const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header id="app-header" className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight truncate">DSE Strategy Lab</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">Volume breakout screener &amp; backtester for Dhaka Stock Exchange</p>
            </div>
          </div>

          {/* Firebase Auth & Cloud Sync Control */}
          {!authLoading && (
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-5 h-5 rounded-full border border-emerald-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="font-semibold text-slate-200 text-[11px] truncate max-w-[100px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                      <CloudCheck className="w-2.5 h-2.5" /> Synced
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-1 hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/10 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sync with Google</span>
                  <span className="sm:hidden">Sign in</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
