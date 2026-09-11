import React, { useState } from 'react';
import { OllamaOptions, ChatSession } from '../types';
import { X, Sliders, Server, Shield, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaUrl: string;
  onUpdateOllamaUrl: (url: string) => void;
  currentSession: ChatSession | null;
  onUpdateSessionSettings: (systemPrompt: string, options: OllamaOptions) => void;
  onTestConnection: () => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  ollamaUrl,
  onUpdateOllamaUrl,
  currentSession,
  onUpdateSessionSettings,
  onTestConnection,
}) => {
  const [urlInput, setUrlInput] = useState(ollamaUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  // Local state for session parameters
  const [systemPrompt, setSystemPrompt] = useState(currentSession?.systemPrompt || '');
  const [temperature, setTemperature] = useState(currentSession?.options?.temperature ?? 0.7);
  const [topP, setTopP] = useState(currentSession?.options?.top_p ?? 0.9);
  const [numCtx, setNumCtx] = useState(currentSession?.options?.num_ctx ?? 4096);
  const [numPredict, setNumPredict] = useState(currentSession?.options?.num_predict ?? -1);

  // Sync when currentSession changes
  React.useEffect(() => {
    if (currentSession) {
      setSystemPrompt(currentSession.systemPrompt || '');
      setTemperature(currentSession.options?.temperature ?? 0.7);
      setTopP(currentSession.options?.top_p ?? 0.9);
      setNumCtx(currentSession.options?.num_ctx ?? 4096);
      setNumPredict(currentSession.options?.num_predict ?? -1);
    }
  }, [currentSession]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOllamaUrl(urlInput);
    if (currentSession) {
      onUpdateSessionSettings(systemPrompt, {
        temperature,
        top_p: topP,
        num_ctx: numCtx,
        num_predict: numPredict,
      });
    }
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    onUpdateOllamaUrl(urlInput);
    const success = await onTestConnection();
    setTestResult(success);
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">Settings & Parameters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Ollama Endpoint Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Server className="w-4 h-4 text-indigo-500" />
              <span>Ollama Endpoint URL</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Test Connection</span>
              </button>
            </div>
            {testResult !== null && (
              <div className={`flex items-center gap-2 text-xs font-medium ${testResult ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {testResult ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{testResult ? 'Successfully connected to Ollama!' : 'Failed to connect to Ollama endpoint.'}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 space-y-1.5 leading-normal">
              <p>
                <strong>Local Machine:</strong> Ensure Ollama service is running (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500">ollama serve</code>) on <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500">http://localhost:11434</code>.
              </p>
              <p>
                <strong>Docker / Container / WSL:</strong> Try using endpoint <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500">http://host.docker.internal:11434</code> and ensure Ollama host is set to <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500">OLLAMA_HOST=0.0.0.0:11434</code>.
              </p>
              <p>
                <strong>CORS:</strong> Allow cross-origin requests by running <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500">OLLAMA_ORIGINS="*" ollama serve</code>.
              </p>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>System Prompt (Current Chat)</span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g. You are a helpful expert programming assistant..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Model Parameters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Inference Parameters</span>
            </div>

            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Temperature (Creativity)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Precise (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (2.0)</span>
              </div>
            </div>

            {/* Top P */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Top P (Nucleus Sampling)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{topP}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Context Window */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  Context Window (num_ctx)
                </label>
                <select
                  value={numCtx}
                  onChange={(e) => setNumCtx(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2048}>2048 tokens</option>
                  <option value={4096}>4096 tokens</option>
                  <option value={8192}>8192 tokens</option>
                  <option value={16384}>16384 tokens</option>
                  <option value={32768}>32768 tokens</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  Max Tokens (num_predict)
                </label>
                <input
                  type="number"
                  value={numPredict}
                  onChange={(e) => setNumPredict(parseInt(e.target.value) || -1)}
                  placeholder="-1 for infinite"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
