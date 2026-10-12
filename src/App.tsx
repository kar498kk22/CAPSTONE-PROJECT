import React, { useState, useEffect } from 'react';
import { Claim, ClaimDocument, ClaimStatus, User, AuthSession } from './types';
import { Header } from './components/Header';
import { ClaimantPortalView } from './components/ClaimantPortalView';
import { AdjusterDashboard } from './components/AdjusterDashboard';
import { BankingTerminalView } from './components/BankingTerminalView';
import { ClaimDetailModal } from './components/ClaimDetailModal';
import { NewClaimModal } from './components/NewClaimModal';
import { BankingPayoutModal } from './components/BankingPayoutModal';
import { AuthModal } from './components/AuthModal';
import { Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [currentView, setCurrentView] = useState<'claimant' | 'adjuster' | 'banking'>('claimant');

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('claimflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Modals
  const [selectedClaimForDetail, setSelectedClaimForDetail] = useState<Claim | null>(null);
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutTargetClaim, setPayoutTargetClaim] = useState<Claim | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth Handlers
  const handleAuthSuccess = (session: AuthSession) => {
    try {
      localStorage.setItem('claimflow_user', JSON.stringify(session.user));
      localStorage.setItem('claimflow_token', session.token);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setCurrentUser(session.user);
    if (session.user.role === 'adjuster') {
      setCurrentView('adjuster');
    } else {
      setCurrentView('claimant');
    }
    showToast(`Welcome, ${session.user.name}! (${session.user.username})`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('claimflow_user');
      localStorage.removeItem('claimflow_token');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Fetch claims from backend
  const fetchClaims = async () => {
    try {
      const res = await fetch('/api/claims');
      const data = await res.json();
      if (data.success && data.claims) {
        setClaims(data.claims);
        if (!selectedClaimId && data.claims.length > 0) {
          setSelectedClaimId(data.claims[0].id);
        }
      }
    } catch (err) {
      console.warn('Backend claims fetch failed, maintaining existing state:', err);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  // Advance lifecycle status
  const handleAdvanceStatus = async (claimId: string, nextStatus: ClaimStatus, note?: string) => {
    try {
      const res = await fetch(`/api/claims/${claimId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus, note }),
      });
      const data = await res.json();
      if (data.success && data.claim) {
        setClaims((prev) => prev.map((c) => (c.id === claimId ? data.claim : c)));
        if (selectedClaimForDetail?.id === claimId) {
          setSelectedClaimForDetail(data.claim);
        }
        showToast(`Status updated: ${data.claim.claimNumber} is now ${nextStatus}`);
      }
    } catch (err) {
      console.error('Failed to advance claim status:', err);
    }
  };

  // Open instant payout modal
  const handleTriggerPayout = (claim: Claim) => {
    setPayoutTargetClaim(claim);
    setIsPayoutModalOpen(true);
  };

  // Settlement completed
  const handlePayoutSettled = (updatedClaim: Claim) => {
    setClaims((prev) => prev.map((c) => (c.id === updatedClaim.id ? updatedClaim : c)));
    if (selectedClaimForDetail?.id === updatedClaim.id) {
      setSelectedClaimForDetail(updatedClaim);
    }
    showToast(`Instant Payout Settled: ₹${updatedClaim.netPayout.toLocaleString()} via FedNow®`);
  };

  // Add document to existing claim
  const handleAddDocumentToClaim = async (claimId: string, doc: ClaimDocument) => {
    try {
      const res = await fetch(`/api/claims/${claimId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: doc }),
      });
      const data = await res.json();
      if (data.success && data.claim) {
        setClaims((prev) => prev.map((c) => (c.id === claimId ? data.claim : c)));
        if (selectedClaimForDetail?.id === claimId) {
          setSelectedClaimForDetail(data.claim);
        }
        showToast(`Attached ${doc.name} with AI verification`);
      }
    } catch (err) {
      console.error('Failed to attach document:', err);
    }
  };

  // New claim created
  const handleClaimCreated = (newClaim: Claim) => {
    setClaims((prev) => [newClaim, ...prev]);
    setSelectedClaimId(newClaim.id);
    setCurrentView('claimant');
    showToast(`Claim ${newClaim.claimNumber} registered & automated tracking active`);
  };

  // Calculate live stats
  const totalSettledAmount = claims
    .filter((c) => c.status === 'PAYOUT_SETTLED')
    .reduce((acc, c) => acc + (c.payoutTransaction?.amount || c.netPayout), 0);

  const activeClaimsCount = claims.filter((c) => c.status !== 'PAYOUT_SETTLED').length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Global Header */}
      <Header
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onOpenNewClaim={() => setIsNewClaimModalOpen(true)}
        totalSettledAmount={totalSettledAmount}
        activeClaimsCount={activeClaimsCount}
        currentUser={currentUser}
        onOpenAuthModal={openAuthModal}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'claimant' && (
          <ClaimantPortalView
            claims={claims}
            selectedClaimId={selectedClaimId}
            onSelectClaim={(c) => setSelectedClaimId(c.id)}
            onOpenNewClaim={() => setIsNewClaimModalOpen(true)}
            onAdvanceStatus={handleAdvanceStatus}
            onTriggerPayout={handleTriggerPayout}
            onAddDocumentToClaim={handleAddDocumentToClaim}
            currentUser={currentUser}
            onOpenAuthModal={openAuthModal}
            onViewClaimDetail={(c) => setSelectedClaimForDetail(c)}
          />
        )}

        {currentView === 'adjuster' && (
          <AdjusterDashboard
            claims={claims}
            onSelectClaim={(c) => setSelectedClaimForDetail(c)}
            onAdvanceStatus={handleAdvanceStatus}
            onTriggerPayout={handleTriggerPayout}
            onOpenNewClaim={() => setIsNewClaimModalOpen(true)}
          />
        )}

        {currentView === 'banking' && (
          <BankingTerminalView
            claims={claims}
            onTriggerPayout={handleTriggerPayout}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">ClaimFlow Enterprise</span>
            <span>•</span>
            <span>FedNow® Service, The Clearing House RTP® & Open Banking APIs</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Security: ISO 20022 Certified</span>
            <span>Latency: &lt; 2.0s</span>
          </div>
        </div>
      </footer>

      {/* Deep Claim Detail Modal */}
      {selectedClaimForDetail && (
        <ClaimDetailModal
          isOpen={!!selectedClaimForDetail}
          onClose={() => setSelectedClaimForDetail(null)}
          claim={selectedClaimForDetail}
          onAdvanceStatus={handleAdvanceStatus}
          onTriggerPayout={handleTriggerPayout}
          onAddDocumentToClaim={handleAddDocumentToClaim}
        />
      )}

      {/* New Claim Modal */}
      <NewClaimModal
        isOpen={isNewClaimModalOpen}
        onClose={() => setIsNewClaimModalOpen(false)}
        onClaimCreated={handleClaimCreated}
        currentUser={currentUser}
      />

      {/* Banking Payout Modal */}
      {payoutTargetClaim && (
        <BankingPayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => {
            setIsPayoutModalOpen(false);
            setPayoutTargetClaim(null);
          }}
          claim={payoutTargetClaim}
          onPayoutSettled={handlePayoutSettled}
        />
      )}

      {/* User Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Global Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-emerald-500/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-200">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
