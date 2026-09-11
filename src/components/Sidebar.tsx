import React, { useState } from 'react';
import { ChatSession, OllamaModel } from '../types';
import {
  Plus,
  MessageSquare,
  Search,
  Settings,
  Cpu,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Download,
  Menu,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  models: OllamaModel[];
  currentModel: string;
  onSelectModel: (model: string) => void;
  onOpenSettings: () => void;
  onOpenModelManager: () => void;
  isConnected: boolean;
  ollamaUrl: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onScanModels: () => Promise<void>;
  isScanning: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  models,
  currentModel,
  onSelectModel,
  onOpenSettings,
  onOpenModelManager,
  isConnected,
  ollamaUrl,
  isOpen,
  onToggleOpen,
  onScanModels,
  isScanning,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
          onClick={onToggleOpen}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-80 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / New Chat */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white italic shadow-sm">O</div>
            <div>
              <span className="font-semibold text-base tracking-tight text-slate-100">Ollama Local</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[11px] text-slate-400 font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onToggleOpen}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onToggleOpen();
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition-all duration-150 text-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Model Selector Bar */}
        <div className="px-4 pb-2">
          <div className="bg-slate-800 rounded-md p-2.5 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
              <div className="flex items-center gap-2">
                <span>Active Model</span>
                <button
                  onClick={onScanModels}
                  disabled={isScanning}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-semibold"
                  title="Scan for local models"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>Scan</span>
                </button>
              </div>
              <button
                onClick={onOpenModelManager}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
              >
                <Download className="w-3 h-3" />
                Manage
              </button>
            </div>
            <div className="relative">
              <select
                value={currentModel}
                onChange={(e) => onSelectModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
              >
                {models.length === 0 ? (
                  <option value="">No models found (Pull one)</option>
                ) : (
                  models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} {m.details?.parameter_size ? `(${m.details.parameter_size})` : ''}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search input */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-2 tracking-widest">
            Recent Chats
          </div>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No chat history yet
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    if (window.innerWidth < 768) onToggleOpen();
                  }}
                  className={`group relative flex items-center justify-between p-3 text-sm rounded-md cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 border-l-2 border-indigo-400 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {editingId === s.id ? (
                      <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-slate-100 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(s.id, e as any);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={(e) => saveRename(s.id, e)}
                          className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="truncate">{s.title}</span>
                    )}
                  </div>

                  {/* Session Action buttons */}
                  {editingId !== s.id && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startRename(s, e)}
                        title="Rename chat"
                        className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(s.id);
                        }}
                        title="Delete chat"
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer / User Profile & Settings */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3 p-1 flex-1">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-semibold text-slate-200">U</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">Local User</div>
              <div className="text-[10px] text-slate-500 truncate">{ollamaUrl}</div>
            </div>
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
