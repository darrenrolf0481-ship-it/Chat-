import React, { useState } from 'react';
import { OllamaModel } from '../types';
import { X, Download, Trash2, Cpu, HardDrive, RefreshCw, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: OllamaModel[];
  ollamaUrl: string;
  onRefreshModels: () => Promise<void>;
}

export const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOpen,
  onClose,
  models,
  ollamaUrl,
  onRefreshModels,
}) => {
  const [modelToPull, setModelToPull] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<string>('');
  const [pullError, setPullError] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelToPull.trim()) return;

    setPulling(true);
    setPullStatus(`Initiating download for ${modelToPull}...`);
    setPullError(null);

    try {
      const response = await fetch('/api/ollama/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ollama-Url': ollamaUrl,
        },
        body: JSON.stringify({ name: modelToPull.trim() }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to pull model');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Ollama outputs newline-delimited JSON status objects
          const lines = chunk.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.status) {
                let statusText = parsed.status;
                if (parsed.completed && parsed.total) {
                  const percent = Math.round((parsed.completed / parsed.total) * 100);
                  statusText = `${parsed.status} (${percent}%)`;
                }
                setPullStatus(statusText);
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }

      setPullStatus('Model pulled successfully!');
      setModelToPull('');
      await onRefreshModels();
    } catch (err: any) {
      setPullError(err.message || 'Error pulling model');
    } finally {
      setPulling(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete model "${name}" from Ollama?`)) return;

    setDeletingName(name);
    try {
      const response = await fetch('/api/ollama/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Ollama-Url': ollamaUrl,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete model');
      }

      await onRefreshModels();
    } catch (err: any) {
      alert(`Error deleting model: ${err.message}`);
    } finally {
      setDeletingName(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const popularPresets = ['llama3:8b', 'mistral', 'gemma2', 'phi3', 'codellama', 'deepseek-r1:8b'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">Ollama Model Manager</h2>
              <p className="text-xs text-slate-400">Download, inspect, or remove local LLM models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Pull new model form */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-4 h-4 text-indigo-500" />
              <span>Pull New Model from Library</span>
            </h3>
            <form onSubmit={handlePull} className="flex gap-2">
              <input
                type="text"
                value={modelToPull}
                onChange={(e) => setModelToPull(e.target.value)}
                placeholder="e.g. llama3, mistral, gemma2:7b"
                disabled={pulling}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={pulling || !modelToPull.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                {pulling && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Pull Model</span>
              </button>
            </form>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Popular presets:</span>
              {popularPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setModelToPull(preset)}
                  disabled={pulling}
                  className="text-[11px] bg-slate-200/60 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg transition-colors font-medium"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Pull status output */}
            {pulling && (
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-3 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="font-medium truncate">{pullStatus}</span>
              </div>
            )}

            {pullError && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pullError}</span>
              </div>
            )}
          </div>

          {/* Installed models list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span>Installed Models ({models.length})</span>
              </h3>
              <button
                onClick={onRefreshModels}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {models.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 mb-1">No models installed locally</p>
                <p className="text-xs text-slate-400">Use the pull form above to download a model (e.g. llama3)</p>
              </div>
            ) : (
              <div className="space-y-2">
                {models.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{m.name}</span>
                        {m.details?.parameter_size && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md">
                            {m.details.parameter_size}
                          </span>
                        )}
                        {m.details?.family && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                            {m.details.family}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Size: {formatSize(m.size)}</span>
                        <span>•</span>
                        <span>Modified: {new Date(m.modified_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(m.name)}
                      disabled={deletingName === m.name}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete model"
                    >
                      {deletingName === m.name ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
