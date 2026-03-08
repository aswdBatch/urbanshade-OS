interface SiteLockedScreenProps {
  reason: string;
}

export const SiteLockedScreen = ({ reason }: SiteLockedScreenProps) => (
  <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-red-950 via-slate-950 to-black flex items-center justify-center">
    <div className="text-center max-w-lg p-8">
      <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-red-400 mb-4 font-mono tracking-wider">SITE LOCKED</h1>
      <p className="text-slate-400 mb-6 font-mono text-sm leading-relaxed">{reason}</p>
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 mb-6">
        <p className="text-xs text-red-300/70 font-mono">
          An administrator has locked access to this site. Please check back later or contact support.
        </p>
      </div>
      <div className="text-xs text-slate-600 font-mono">
        URBANSHADE SECURITY SYSTEM • ALL ACCESS RESTRICTED
      </div>
    </div>
  </div>
);
