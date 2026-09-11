import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import {
  User,
  Bot,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Edit2,
  CheckCheck,
  Terminal,
  Cpu,
  Clock
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  modelName: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
  onRegenerate?: () => void;
  isLastAssistantMessage?: boolean;
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  modelName,
  onDelete,
  onEdit,
  onRegenerate,
  isLastAssistantMessage,
  isLoading
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  // Format token speed if available
  const formatStats = () => {
    if (!message.evalDuration || !message.evalCount) return null;
    const seconds = message.evalDuration / 1e9;
    const tokensPerSec = (message.evalCount / seconds).toFixed(1);
    return `${tokensPerSec} tok/s (${message.evalCount} tokens in ${seconds.toFixed(2)}s)`;
  };

  return (
    <div className={`py-4 px-4 md:px-8 w-full ${!isUser ? 'max-w-3xl mx-auto' : 'max-w-3xl mx-auto'}`}>
      <div className={`flex items-start space-x-4 ${!isUser ? 'bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm' : ''}`}>
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              AI
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {isUser ? 'User' : modelName || 'Llama 3'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                title="Copy text"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              {isUser && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              {!isUser && isLastAssistantMessage && onRegenerate && !isLoading && (
                <button
                  onClick={onRegenerate}
                  title="Regenerate response"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onDelete(message.id)}
                title="Delete message"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message body */}
          {isEditing ? (
            <div className="space-y-3 mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 shadow-sm"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save & Submit
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed overflow-x-auto space-y-4">
              {isUser ? (
                <div className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-100">{message.content}</div>
              ) : (
                <div className="markdown-content prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Token generation stats badge */}
          {!isUser && formatStats() && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 mt-3 pt-3">
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-[11px] font-mono">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                {formatStats()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
