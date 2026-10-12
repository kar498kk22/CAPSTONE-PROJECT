import React from 'react';
import { User as UserType } from '../types';
import { Shield, Zap, Building2, User, FileText, LogIn, LogOut, Phone, Mail } from 'lucide-react';

interface HeaderProps {
  currentView: 'claimant' | 'adjuster' | 'banking';
  onViewChange: (view: 'claimant' | 'adjuster' | 'banking') => void;
  onOpenNewClaim: () => void;
  totalSettledAmount: number;
  activeClaimsCount: number;
  currentUser: UserType | null;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenNewClaim,
  totalSettledAmount,
  activeClaimsCount,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white flex items-center">
                  Claim<span className="text-emerald-400">Flow</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
                  RTP & FedNow®
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Automated Claims & Instant Banking Settlements</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => onViewChange('claimant')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'claimant'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Claimant Portal</span>
            </button>

            <button
              onClick={() => onViewChange('adjuster')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'adjuster'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Adjuster Desk</span>
              {activeClaimsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  {activeClaimsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange('banking')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'banking'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Banking Gateway</span>
            </button>
          </div>

          {/* Right Section: Auth & Actions */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight pr-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="truncate max-w-[110px]">{currentUser.name}</span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                      {currentUser.role === 'adjuster' ? 'Adjuster' : 'Claimant'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono truncate max-w-[130px]">
                    {currentUser.identifierType === 'phone' ? (
                      <Phone className="w-2.5 h-2.5 text-blue-400" />
                    ) : (
                      <Mail className="w-2.5 h-2.5 text-emerald-400" />
                    )}
                    <span>{currentUser.username}</span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all"
                >
                  <span>Register</span>
                </button>
              </div>
            )}

            <button
              onClick={onOpenNewClaim}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span className="hidden sm:inline">File New Claim</span>
              <span className="sm:hidden">File</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
