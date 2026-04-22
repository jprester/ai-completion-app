import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ToolTip from './components/tooltip/Tooltip';
import Rail from './components/rail/Rail';
import Palette from './components/palette/Palette';
import Spinner from './components/spinner/Spinner';
import SettingsModal from './components/settings/Settings';
import MessageList from './components/messages/MessageList';

import Plus from './assets/icons/Plus';
import ImageIcon from './assets/icons/Image';
import Search from './assets/icons/Search';
import Star from './assets/icons/Star';
import Send from './assets/icons/Send';
import X from './assets/icons/X';
import Trash from './assets/icons/Trash';
import Gear from './assets/icons/Gear';
import Sun from './assets/icons/Sun';
import Moon from './assets/icons/Moon';

import { fetchCompletion, fetchImageRecognition, fetchMockResponse } from './services/api';
import { useConversations, autoTitle } from './hooks/useConversations';
import type { Message } from './hooks/useConversations';
import { useHotkeys } from './hooks/useHotkeys';
import { useSettings } from './hooks/useSettings';
import { QUICK_ACTIONS, getAction } from './quickActions';
import type { ChatOption } from './quickActions';

import './App.css';

const RAIL_KEY = 'mc-rail';
const MAX_CHATS_DEFAULT = 20;

function App() {
  const maxChats = (() => {
    const n = parseInt(import.meta.env.VITE_MAX_CHATS, 10);
    return isFinite(n) && n > 0 ? n : MAX_CHATS_DEFAULT;
  })();

  const {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    appendMessages,
    updateConversation,
    deleteConversation,
    togglePin,
    clearAll,
  } = useConversations();

  const { settings, setSettings, resetSettings } = useSettings();

  const [railExpanded, setRailExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(RAIL_KEY) !== 'collapsed';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(RAIL_KEY, railExpanded ? 'expanded' : 'collapsed');
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [railExpanded]);

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const html = document.documentElement;
    const apply = (mode: 'light' | 'dark') => {
      html.setAttribute('data-theme', mode);
      setResolvedTheme(mode);
    };
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
    apply(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accent);
  }, [settings.accent]);

  const [userPrompt, setUserPrompt] = useState('');
  const [useMock, setUseMock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatOption, setChatOption] = useState<ChatOption>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<{ base64String: string; name: string }>();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );
  const messages = activeConversation?.messages ?? [];
  const chatCount = messages.filter((m) => m.role === 'user' && m.type === 'text').length;
  const initialChatState = messages.length === 0;

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 240) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [userPrompt, autoResize]);

  const resetComposer = useCallback(() => {
    setUserPrompt('');
    setImagePrompt(undefined);
    setChatOption(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, []);

  const focusComposer = () => setTimeout(() => textareaRef.current?.focus(), 0);

  const handleNewChat = useCallback(() => {
    setActiveId(null);
    setError(null);
    resetComposer();
    focusComposer();
  }, [resetComposer, setActiveId]);

  const handleSelectChat = useCallback(
    (id: string) => {
      setActiveId(id);
      setError(null);
      resetComposer();
    },
    [resetComposer, setActiveId]
  );

  const applyQuickAction = useCallback((id: Exclude<ChatOption, null>) => {
    setChatOption((prev) => (prev === id ? null : id));
    if (id === 'image-recognition') {
      fileInputRef.current?.click();
    } else {
      setImagePrompt(undefined);
      focusComposer();
    }
  }, []);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setChatOption('image-recognition');
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePrompt({ base64String, name: file.name });
      focusComposer();
    };
    reader.onerror = () => setError('Failed to read image file');
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }, []);

  const copyMessage = useCallback(
    async (content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        showToast('Copied');
      } catch {
        showToast('Copy failed');
      }
    },
    [showToast]
  );

  const fetchChatResponse = async () => {
    if (isLoading) return;
    if (!userPrompt.trim() && !imagePrompt) return;
    if (chatCount >= maxChats) return;

    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    const action = getAction(chatOption);
    const promptText = action ? action.prompt(userPrompt) : userPrompt;

    let conv = activeConversation;
    if (!conv) {
      conv = createConversation(userPrompt || action?.label || 'New chat');
    } else if (conv.messages.length === 0) {
      updateConversation(conv.id, {
        title: autoTitle(userPrompt || action?.label || 'New chat'),
      });
    }
    const convId = conv.id;

    const newUserMessages: Message[] = imagePrompt
      ? [
          { role: 'user', type: 'text', content: promptText },
          { role: 'user', type: 'image', content: imagePrompt.base64String },
        ]
      : [{ role: 'user', type: 'text', content: promptText }];

    appendMessages(convId, newUserMessages);

    const historyForApi: Message[] = [...conv.messages, ...newUserMessages];

    try {
      let responseMessage: string | undefined;

      if (useMock) {
        const mockData = await fetchMockResponse();
        responseMessage = mockData.response;
      } else if (chatOption === 'image-recognition') {
        const chatResponse = await fetchImageRecognition(historyForApi, settings.imageModel, settings.imageProvider, signal);
        responseMessage = chatResponse.response;
      } else {
        const textMessages = historyForApi
          .filter((m) => m.type === 'text')
          .map((m) => ({ role: m.role, content: m.content }));
        const chatResponse = await fetchCompletion(textMessages, settings.textModel, settings.textProvider, signal);
        responseMessage = chatResponse.response;
      }

      if (responseMessage) {
        appendMessages(convId, [{ role: 'assistant', type: 'text', content: responseMessage }]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        resetComposer();
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserPrompt(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      fetchChatResponse();
    } else if (event.key === 'Backspace' && userPrompt === '' && chatOption) {
      event.preventDefault();
      setChatOption(null);
      setImagePrompt(undefined);
    }
  };

  useHotkeys(
    {
      'mod+k': (e) => {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      },
      'mod+n': (e) => {
        e.preventDefault();
        handleNewChat();
      },
      'mod+\\': (e) => {
        e.preventDefault();
        setRailExpanded((r) => !r);
      },
      'mod+1': (e) => {
        e.preventDefault();
        applyQuickAction('proofread');
      },
      'mod+2': (e) => {
        e.preventDefault();
        applyQuickAction('summarize');
      },
      'mod+3': (e) => {
        e.preventDefault();
        applyQuickAction('factcheck');
      },
      'mod+4': (e) => {
        e.preventDefault();
        applyQuickAction('brainstorm');
      },
      'mod+5': (e) => {
        e.preventDefault();
        applyQuickAction('image-recognition');
      },
    },
    [handleNewChat, applyQuickAction]
  );

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isLoading]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const placeholderText = useMemo(() => {
    switch (chatOption) {
      case 'summarize':
        return 'Paste the text to summarize…';
      case 'proofread':
        return 'Paste the text to proofread…';
      case 'factcheck':
        return 'Paste the claim to fact-check…';
      case 'brainstorm':
        return 'What should we brainstorm about?';
      case 'image-recognition':
        return 'Ask a question about the image (optional)';
      default:
        return 'Ask anything, or press ⌘K';
    }
  }, [chatOption]);

  const canSendMessage = userPrompt.trim().length > 0 || !!imagePrompt?.base64String;
  const action = getAction(chatOption);
  const activeModel =
    chatOption === 'image-recognition' ? settings.imageModel : settings.textModel;

  const handlePaletteRunPrompt = (id: string) => {
    setPaletteOpen(false);
    applyQuickAction(id as Exclude<ChatOption, null>);
  };
  const handlePaletteOpenChat = (id: string) => {
    setPaletteOpen(false);
    handleSelectChat(id);
  };

  const toggleTheme = () => {
    setSettings({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' });
  };

  const handleClearConversations = () => {
    if (conversations.length === 0) return;
    if (confirm(`Delete all ${conversations.length} saved conversations? This cannot be undone.`)) {
      clearAll();
      showToast('All conversations cleared');
    }
  };

  return (
    <div className="App">
      <Rail
        expanded={railExpanded}
        onToggle={() => setRailExpanded((r) => !r)}
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectChat}
        onNew={handleNewChat}
        onSearch={() => setPaletteOpen(true)}
      />

      <main className="main">
        <div className="main-header">
          <div className="main-crumb">
            {activeConversation ? (
              <span className="crumb-title">{activeConversation.title}</span>
            ) : (
              <span className="crumb-muted">New chat</span>
            )}
          </div>
          <div className="main-actions">
            {activeConversation && (
              <>
                <ToolTip text={activeConversation.pinned ? 'Unpin' : 'Pin'} position="bottom">
                  <button
                    className={`icon-btn ${activeConversation.pinned ? 'on' : ''}`}
                    onClick={() => togglePin(activeConversation.id)}
                    aria-label={activeConversation.pinned ? 'Unpin chat' : 'Pin chat'}
                  >
                    <Star size={16} />
                  </button>
                </ToolTip>
                <ToolTip text="Delete chat" position="bottom">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      if (confirm('Delete this chat?')) deleteConversation(activeConversation.id);
                    }}
                    aria-label="Delete chat"
                  >
                    <Trash size={16} />
                  </button>
                </ToolTip>
              </>
            )}
            <ToolTip text="Search (⌘K)" position="bottom">
              <button className="icon-btn" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
                <Search size={16} />
              </button>
            </ToolTip>
            <ToolTip text="New chat (⌘N)" position="bottom">
              <button
                className={`icon-btn ${messages.length === 0 ? 'disabled' : ''}`}
                onClick={handleNewChat}
                disabled={messages.length === 0}
                aria-label="Start new chat"
              >
                <Plus />
              </button>
            </ToolTip>
            <ToolTip text={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'} position="bottom">
              <button
                className="icon-btn"
                onClick={toggleTheme}
                aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </ToolTip>
            <ToolTip text="Settings" position="bottom">
              <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
                <Gear size={16} />
              </button>
            </ToolTip>
            {import.meta.env.VITE_ENV !== 'production' && (
              <label className="mock-toggle">
                <input type="checkbox" checked={useMock} onChange={() => setUseMock(!useMock)} />
                <span>Mock</span>
              </label>
            )}
          </div>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        )}

        {initialChatState ? (
          <div className="hero">
            <h1 className="hero-title">What's on your mind?</h1>
            <p className="hero-sub">
              Pick a quick action, or just type. Press <kbd>⌘K</kbd> for anything.
            </p>
            <div className="quick-actions-row">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.Icon;
                return (
                  <button
                    key={a.id}
                    className={`quick-chip ${chatOption === a.id ? 'active' : ''}`}
                    onClick={() => applyQuickAction(a.id)}
                    aria-pressed={chatOption === a.id}
                  >
                    <span className="quick-chip-icon">
                      <Icon size={13} />
                    </span>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="messages-section" ref={messagesContainerRef}>
            <MessageList messages={messages} isLoading={isLoading} onCopy={copyMessage} />
          </div>
        )}

        <div className="composer-wrap">
          {chatCount >= maxChats ? (
            <div className="chat-status-label">
              Chat limit reached for this conversation. Start a new chat to continue.
            </div>
          ) : (
            <>
              <div className="composer">
                {(action || imagePrompt) && (
                  <div className="composer-pills">
                    {action && (
                      <div className="action-pill">
                        <action.Icon size={12} />
                        {action.label}
                        <button className="pill-close" onClick={() => setChatOption(null)} aria-label="Clear action">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {imagePrompt && (
                      <div className="image-pill">
                        <img src={imagePrompt.base64String} className="image-pill-thumb" alt="Selected preview" />
                        <span className="image-pill-name">{imagePrompt.name}</span>
                        <button
                          className="pill-close"
                          onClick={() => setImagePrompt(undefined)}
                          aria-label="Remove selected image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={userPrompt}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={placeholderText}
                  aria-label="Chat message input"
                />
                <div className="composer-row">
                  <ToolTip text="Attach image" position="top">
                    <label className="image-upload-btn" aria-label="Upload image">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <ImageIcon />
                    </label>
                  </ToolTip>
                  <ToolTip text="Change model" position="top">
                    <button
                      type="button"
                      className="model-pill"
                      onClick={() => setSettingsOpen(true)}
                      aria-label={`Current model: ${activeModel}. Click to change.`}
                    >
                      <span className="model-pill-dot" />
                      <span className="model-pill-name">{activeModel}</span>
                    </button>
                  </ToolTip>
                  <div className="spacer" />
                  <span className="composer-hint-inline">↵ send · ⇧↵ newline</span>
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <ToolTip text="Send" position="top">
                      <button
                        className="send-btn"
                        onClick={() => fetchChatResponse()}
                        disabled={!canSendMessage}
                        aria-label="Send message"
                      >
                        <Send />
                      </button>
                    </ToolTip>
                  )}
                </div>
              </div>
              {initialChatState && (
                <p className="composer-hint">
                  Your chats are saved locally. Use <kbd>⌘K</kbd> to search, <kbd>⌘N</kbd> for new, <kbd>⌘\</kbd> to
                  toggle sidebar.
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <Palette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onRunPrompt={handlePaletteRunPrompt}
        onOpenChat={handlePaletteOpenChat}
        conversations={conversations}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        onReset={resetSettings}
        onClearConversations={handleClearConversations}
        conversationCount={conversations.length}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
