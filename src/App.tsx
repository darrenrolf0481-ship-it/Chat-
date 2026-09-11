import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Message, OllamaModel, OllamaOptions } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { ModelManagerModal } from './components/ModelManagerModal';

export default function App() {
  const [ollamaUrl, setOllamaUrl] = useState<string>(() => {
    return localStorage.getItem('ollama_url') || 'http://localhost:11434';
  });
  const [models, setModels] = useState<OllamaModel[]>([
    { name: 'llama3:latest', model: 'llama3:latest', modified_at: new Date().toISOString(), size: 4700000000, digest: 'sha256:abc', details: { parameter_size: '8B', family: 'llama' } },
    { name: 'mistral:latest', model: 'mistral:latest', modified_at: new Date().toISOString(), size: 4100000000, digest: 'sha256:def', details: { parameter_size: '7B', family: 'mistral' } },
    { name: 'gemma2:latest', model: 'gemma2:latest', modified_at: new Date().toISOString(), size: 5400000000, digest: 'sha256:ghi', details: { parameter_size: '9B', family: 'gemma' } }
  ]);
  const [currentModel, setCurrentModel] = useState<string>('llama3:latest');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ollama_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    if (sessions.length > 0) return sessions[0].id;
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isModelManagerOpen, setIsModelManagerOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('ollama_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Save ollama url
  useEffect(() => {
    localStorage.setItem('ollama_url', ollamaUrl);
  }, [ollamaUrl]);

  // Fetch models on mount or when ollamaUrl changes
  const fetchModels = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/ollama/tags', {
        headers: {
          'X-Ollama-Url': ollamaUrl,
        },
      });
      const data = await response.json();
      if (!response.ok || data.connected === false) {
        setIsConnected(false);
        return;
      }
      const fetchedModels: OllamaModel[] = data.models || [];
      if (fetchedModels.length > 0) {
        setModels(fetchedModels);
        if (!currentModel || !fetchedModels.some(m => m.name === currentModel)) {
          const defaultMod = fetchedModels.find((m) => m.name.includes('llama3')) || fetchedModels[0];
          setCurrentModel(defaultMod.name);
        }
      }
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [ollamaUrl]);

  // Test connection helper
  const handleTestConnection = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/ollama/tags', {
        headers: { 'X-Ollama-Url': ollamaUrl },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.connected === false) {
          setIsConnected(false);
          return false;
        }
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          if (!currentModel) {
            setCurrentModel(data.models[0].name);
          }
        }
        setIsConnected(true);
        return true;
      }
      setIsConnected(false);
      return false;
    } catch {
      setIsConnected(false);
      return false;
    }
  };

  // Create new chat
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Chat',
      model: currentModel || 'llama3',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_ctx: 4096,
      },
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // If no sessions, create initial one
  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    }
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  // Delete session
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Update session settings
  const handleUpdateSessionSettings = (systemPrompt: string, options: OllamaOptions) => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, systemPrompt, options, updatedAt: Date.now() } : s
      )
    );
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: s.messages.filter((m) => m.id !== messageId),
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Edit message
  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const msgIndex = s.messages.findIndex((m) => m.id === messageId);
        if (msgIndex === -1) return s;

        // Truncate messages after this message if editing user prompt
        const truncatedMessages = s.messages.slice(0, msgIndex);
        const updatedUserMsg: Message = {
          ...s.messages[msgIndex],
          content: newContent,
          timestamp: Date.now(),
        };

        return {
          ...s,
          messages: [...truncatedMessages, updatedUserMsg],
          updatedAt: Date.now(),
        };
      })
    );

    // Trigger AI response for the edited prompt
    setTimeout(() => {
      executeChatGeneration([...(activeSession?.messages.slice(0, activeSession.messages.findIndex(m => m.id === messageId)) || []), {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: newContent,
        timestamp: Date.now()
      }]);
    }, 50);
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  // Core chat execution function
  const executeChatGeneration = async (messagesToSend: Message[]) => {
    if (!activeSessionId || !currentModel) return;

    const userMessage = messagesToSend[messagesToSend.length - 1];

    // Auto title if first message
    let sessionTitle = activeSession?.title || 'New Chat';
    if ((activeSession?.messages.length || 0) === 0 && userMessage) {
      sessionTitle = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '');
    }

    const assistantMsgId = 'msg_' + (Date.now() + 1);
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Update session with user message and empty assistant message placeholder
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const existingWithoutUser = s.messages.some((m) => m.id === userMessage.id)
          ? s.messages
          : [...s.messages, userMessage];
        return {
          ...s,
          title: sessionTitle,
          messages: [...existingWithoutUser, initialAssistantMsg],
          updatedAt: Date.now(),
        };
      })
    );

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Format messages for Ollama API
      const apiMessages = messagesToSend.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload: any = {
        model: currentModel,
        messages: apiMessages,
        stream: true,
        options: activeSession?.options || {},
      };

      if (activeSession?.systemPrompt) {
        payload.system = activeSession.systemPrompt;
      }

      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ollama-Url': ollamaUrl,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Ollama API error');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let evalCount = 0;
      let evalDuration = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // NDJSON lines
          const lines = chunk.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                accumulatedContent += parsed.message.content;
              }
              if (parsed.eval_count) evalCount = parsed.eval_count;
              if (parsed.eval_duration) evalDuration = parsed.eval_duration;

              // Update assistant message live
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id !== activeSessionId) return s;
                  const msgs = [...s.messages];
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.id === assistantMsgId) {
                    msgs[msgs.length - 1] = {
                      ...lastMsg,
                      content: accumulatedContent,
                      evalCount,
                      evalDuration,
                    };
                  }
                  return { ...s, messages: msgs };
                })
              );
            } catch {
              // ignore parse errors on partial stream chunks
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const msgs = [...s.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.id === assistantMsgId) {
              msgs[msgs.length - 1] = {
                ...lastMsg,
                content: `*Error connecting to Ollama: ${err.message || 'Unknown error'}*`,
              };
            }
            return { ...s, messages: msgs };
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = (content: string) => {
    if (!activeSession) return;
    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    executeChatGeneration(updatedMessages);
  };

  const handleRegenerate = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    // Remove last assistant message if any, then resend up to user prompt
    const msgs = [...activeSession.messages];
    if (msgs[msgs.length - 1].role === 'assistant') {
      msgs.pop();
    }
    executeChatGeneration(msgs);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        models={models}
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenModelManager={() => setIsModelManagerOpen(true)}
        isConnected={isConnected}
        ollamaUrl={ollamaUrl}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        onScanModels={fetchModels}
        isScanning={isScanning}
      />

      {/* Main Chat Area */}
      <ChatArea
        session={activeSession}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        isLoading={isLoading}
        models={models}
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenModelManager={() => setIsModelManagerOpen(true)}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onRegenerate={handleRegenerate}
        isConnected={isConnected}
        onScanModels={fetchModels}
        onUpdateSessionSettings={handleUpdateSessionSettings}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        ollamaUrl={ollamaUrl}
        onUpdateOllamaUrl={setOllamaUrl}
        currentSession={activeSession}
        onUpdateSessionSettings={handleUpdateSessionSettings}
        onTestConnection={handleTestConnection}
      />

      {/* Model Manager Modal */}
      <ModelManagerModal
        isOpen={isModelManagerOpen}
        onClose={() => setIsModelManagerOpen(false)}
        models={models}
        ollamaUrl={ollamaUrl}
        onRefreshModels={fetchModels}
      />
    </div>
  );
}
