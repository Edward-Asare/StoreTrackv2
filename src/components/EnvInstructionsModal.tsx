import React, { useState } from 'react';
import { X, Database, Terminal, CheckCircle2, ShieldAlert, ExternalLink, RefreshCw, Plug, AlertTriangle } from 'lucide-react';
import { HealthStatus } from '../types';

interface EnvInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthStatus | null;
  onRefreshHealth?: () => void;
}

export const EnvInstructionsModal: React.FC<EnvInstructionsModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefreshHealth
}) => {
  const [inputUri, setInputUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const mongoConnected = health?.connectedToMongo ?? false;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUri.trim()) return;

    setIsConnecting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/health/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongoUri: inputUri.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: 'Connected to MongoDB Atlas successfully! StoreTrack is now synced live with your cloud database.'
        });
        if (onRefreshHealth) onRefreshHealth();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || data.message || 'Connection failed. Please check username, password, or IP access permissions on MongoDB Atlas.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Network error while attempting connection: ' + err.message
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-stone-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl font-bold ${mongoConnected ? 'bg-emerald-700 text-white' : 'bg-orange-500 text-white'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">MongoDB Database Setup</h2>
              <p className="text-xs text-stone-300">StoreTrack Database Status & Live Connection Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-xl hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-700 text-sm">
          
          {/* Current Live Status Box */}
          <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${
            mongoConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-orange-50 border-orange-200 text-orange-950'
          }`}>
            {mongoConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-sm">
                {mongoConnected ? 'Connected to MongoDB Cluster' : 'Running in Local Memory Engine'}
              </h4>
              <p className="text-xs mt-0.5 font-medium">
                {mongoConnected
                  ? 'All product additions, stock changes, and threshold edits are saved directly to your MongoDB database via Mongoose.'
                  : 'StoreTrack is currently operating using a local in-memory fallback.'}
              </p>
              {health?.mongoError && (
                <div className="mt-2.5 p-2.5 bg-red-100 border border-red-200 rounded-xl text-red-900 text-xs font-mono space-y-1">
                  <span className="font-bold block text-red-950">Diagnostic Error Message:</span>
                  <p className="break-all text-[11px]">{health.mongoError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Connect Live URI Form */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <Plug className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-stone-900 text-sm">Connect or Test MongoDB URI</h3>
            </div>

            <form onSubmit={handleConnect} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  MongoDB Connection String
                </label>
                <input
                  type="password"
                  value={inputUri}
                  onChange={(e) => setInputUri(e.target.value)}
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net/storetrack..."
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {feedback && (
                <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 font-medium border ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isConnecting || !inputUri.trim()}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Testing & Connecting...' : 'Connect MongoDB Now'}</span>
              </button>
            </form>
          </div>

          {/* Vercel Deployment & MongoDB Atlas Checklist */}
          <div className="space-y-3 bg-stone-900 text-white p-4 rounded-2xl border border-stone-800">
            <h3 className="font-bold text-emerald-400 text-sm flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Vercel Deployment & Network Checklist:</span>
            </h3>

            <ol className="list-decimal list-inside text-xs space-y-2 text-stone-300 font-medium leading-relaxed">
              <li>
                <strong className="text-white">Allow Access From Anywhere (0.0.0.0/0) in MongoDB Atlas:</strong>
                <br />
                <span className="text-stone-400 text-[11px] pl-4 block">
                  Vercel serverless functions run on dynamic cloud IPs. In your MongoDB Atlas dashboard, go to <strong className="text-stone-200">Network Access</strong> → <strong className="text-stone-200">Add IP Address</strong> → Click <strong className="text-emerald-400">Allow Access from Anywhere (0.0.0.0/0)</strong>. Without this, MongoDB Atlas will block Vercel requests.
                </span>
              </li>
              <li>
                <strong className="text-white">Add MONGODB_URI in Vercel:</strong>
                <br />
                <span className="text-stone-400 text-[11px] pl-4 block">
                  In your Vercel Project → <strong className="text-stone-200">Settings</strong> → <strong className="text-stone-200">Environment Variables</strong>, add key <code className="bg-stone-800 text-emerald-300 px-1 py-0.5 rounded">MONGODB_URI</code> with your full connection string.
                </span>
              </li>
              <li>
                <strong className="text-white">Redeploy Vercel Project:</strong>
                <br />
                <span className="text-stone-400 text-[11px] pl-4 block">
                  After adding environment variables or changing IP whitelist, trigger a fresh deployment on Vercel or click <strong className="text-stone-200">Redeploy</strong> in Vercel deployments list.
                </span>
              </li>
            </ol>
          </div>

          {/* Close button */}
          <div className="pt-3 border-t border-stone-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-stone-800 hover:bg-emerald-800 text-white transition-colors"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
