export default function App() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex items-center justify-center">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    DarkEarn
                </h1>
                <p className="text-slate-400 text-lg">
                    Privacy-First Bounty Platform for Web3 Contributors
                </p>
                <div className="flex gap-3 justify-center text-sm text-slate-500">
                    <span className="px-3 py-1 rounded-full border border-slate-700">ZK Reputation</span>
                    <span className="px-3 py-1 rounded-full border border-slate-700">Private Payments</span>
                    <span className="px-3 py-1 rounded-full border border-slate-700">Reverse Bidding</span>
                </div>
                <p className="text-xs text-slate-600 mt-8">Phase 0 — Scaffold complete. Frontend coming in Phase 3.</p>
            </div>
        </div>
    );
}
