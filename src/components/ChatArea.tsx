import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Message, OllamaModel, OllamaOptions } from '../types';
import { ChatMessage } from './ChatMessage';
import {
  Send,
  Square,
  Menu,
  Sparkles,
  Code,
  Terminal,
  Sliders,
  Download,
  ChevronDown,
  Bot,
  Zap,
  HelpCircle,
  FileText,
  FileJson,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface ChatAreaProps {
  session: ChatSession | null;
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  isLoading: boolean;
  models: OllamaModel[];
  currentModel: string;
  onSelectModel: (model: string) => void;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onOpenModelManager: () => void;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
  isConnected: boolean;
  onScanModels?: () => Promise<void>;
  onUpdateSessionSettings: (systemPrompt: string, options: OllamaOptions) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  onSendMessage,
  onStopGeneration,
  isLoading,
  models,
  currentModel,
  onSelectModel,
  onOpenSidebar,
  onOpenSettings,
  onOpenModelManager,
  onDeleteMessage,
  onEditMessage,
  onRegenerate,
  isConnected,
  onScanModels,
  onUpdateSessionSettings,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [isBehaviorOpen, setIsBehaviorOpen] = useState(false);
  const [behaviorInput, setBehaviorInput] = useState(session?.systemPrompt || '');

  useEffect(() => {
    setBehaviorInput(session?.systemPrompt || '');
  }, [session?.systemPrompt]);

  const handleSaveBehavior = (prompt: string) => {
    setBehaviorInput(prompt);
    if (session) {
      onUpdateSessionSettings(prompt, session.options || { temperature: 0.7, top_p: 0.9, num_ctx: 4096 });
    }
  };

  const lastMessageContent = session?.messages[session.messages.length - 1]?.content;

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isLoading ? 'auto' : 'smooth');
  }, [session?.messages.length, lastMessageContent, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExportJson = () => {
    if (!session) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ollama-chat-${session.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || session.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const samplePrompts = [
    { title: 'Write a React Hook', prompt: 'Write a custom React hook in TypeScript for useDebounce with proper types.' },
    { title: 'Explain Quantum Computing', prompt: 'Explain quantum computing and superposition in simple terms with an analogy.' },
    { title: 'Analyze Python Code', prompt: 'Review this Python snippet for memory leaks and suggest optimizations:\n```python\nclass DataCache:\n    def __init__(self):\n        self.store = []\n    def add(self, item):\n        self.store.append(item)\n```' },
    { title: 'JSON Data Extractor', prompt: 'Extract all email addresses and names from this text into a clean JSON array: "Contact Alice Smith at alice@example.com or Bob Jones at bob@test.org."' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-8 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h2 className="font-medium text-slate-700 dark:text-slate-200 text-sm sm:text-base truncate">
            {session ? session.title : 'Ollama Chat'}
          </h2>
          <span className="hidden md:inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] border border-slate-200 dark:border-slate-700 font-mono">
            MODEL: {currentModel || 'None'}
          </span>
        </div>

        {/* Action icons / stats */}
        <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
          <div className="hidden sm:flex space-x-2">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Ollama</div>
              <div className={`text-xs font-mono font-bold ${isConnected ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                {isConnected ? 'Connected' : 'Offline'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenModelManager}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Models</span>
            </button>

            <button
              onClick={handleExportJson}
              disabled={!session || session.messages.length === 0}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-40 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Export session as JSON"
            >
              <FileJson className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Settings & Parameters"
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Connection Warning Banner */}
      {!isConnected && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-200 flex-shrink-0 z-10">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="space-y-0.5">
              <div>
                <strong>Ollama Disconnected:</strong> Local Ollama service is unreachable at current endpoint.
              </div>
              <div className="text-[11px] opacity-90">
                1. Start Ollama: <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">ollama serve</code> &nbsp;|&nbsp;
                2. Docker/WSL: Use <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">http://host.docker.internal:11434</code> &nbsp;|&nbsp;
                3. CORS: <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">OLLAMA_ORIGINS="*"</code>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-auto">
            {onScanModels && (
              <button
                onClick={onScanModels}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors flex items-center gap-1 shadow-sm"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Connection
              </button>
            )}
            <button
              onClick={onOpenSettings}
              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* Messages or Empty State */}
      <div className="flex-1 overflow-y-auto">
        {!session || session.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              What would you like to explore?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-md">
              Running locally via Ollama with full Markdown rendering, code highlighting, and streaming support.
            </p>

            {/* Quick Prompts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(sp.prompt)}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group text-left shadow-xs"
                >
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {sp.title}
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-1">{sp.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col py-6 space-y-6">
            {session.messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                modelName={currentModel}
                onDelete={onDeleteMessage}
                onEdit={onEditMessage}
                onRegenerate={onRegenerate}
                isLastAssistantMessage={msg.role === 'assistant' && index === session.messages.length - 1}
                isLoading={isLoading}
              />
            ))}
            {isLoading && session.messages[session.messages.length - 1]?.role === 'user' && (
              <div className="py-6 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-3xl mx-auto flex gap-4">
                  <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center text-xs animate-pulse">
                    AI
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Zap className="w-4 h-4 text-indigo-500 animate-bounce" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <footer className="p-8 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent flex-shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute -top-12 left-0 right-0 flex justify-center space-x-2">
            {isLoading && (
              <button
                type="button"
                onClick={onStopGeneration}
                className="bg-white dark:bg-slate-800 px-3 py-1 text-[10px] font-bold text-rose-600 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:border-rose-300 transition-colors"
              >
                Stop Generation
              </button>
            )}
          </div>
          {/* Behavior Prompt Panel */}
          <div className="mb-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <button
                type="button"
                onClick={() => setIsBehaviorOpen(!isBehaviorOpen)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Behavior Prompt / Persona:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] truncate max-w-[200px]">
                  {session?.systemPrompt ? (session.systemPrompt.length > 28 ? session.systemPrompt.slice(0, 28) + '...' : session.systemPrompt) : 'Default (None)'}
                </span>
              </button>
              {session?.systemPrompt && (
                <button
                  type="button"
                  onClick={() => handleSaveBehavior('')}
                  className="text-[11px] text-rose-500 hover:text-rose-600 underline"
                >
                  Clear
                </button>
              )}
            </div>

            {isBehaviorOpen && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-md space-y-2.5 animate-fade-in text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px] flex-wrap gap-1">
                  <span>Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: '💻 Expert Dev', prompt: 'You are an elite software engineer. Write clean, robust, well-documented code with best practices.' },
                      { label: '🎯 Concise', prompt: 'Be extremely concise and direct. Skip pleasantries and provide exact answers.' },
                      { label: '📚 Socratic', prompt: 'Act as a Socratic mentor. Guide the user with insightful questions rather than giving direct answers.' },
                      { label: '✨ Creative', prompt: 'Act as an imaginative creative writer with rich prose and engaging storytelling.' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSaveBehavior(preset.prompt)}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={behaviorInput}
                  onChange={(e) => {
                    setBehaviorInput(e.target.value);
                    handleSaveBehavior(e.target.value);
                  }}
                  placeholder="Set custom behavior or persona for this chat session..."
                  rows={2}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 p-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Send a message to ${currentModel || 'Ollama'}...`}
              rows={3}
              className="w-full p-3 pr-16 bg-transparent border-none focus:ring-0 resize-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Ctrl + Enter to send</span>
              <button
                type="submit"
                disabled={!input.trim() || !currentModel || isLoading}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
};
