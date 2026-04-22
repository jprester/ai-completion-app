import { useCallback, useEffect, useState } from 'react';

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  type: 'text' | 'image';
  content: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  pinned?: boolean;
};

const KEY_CONVOS = 'mc-conversations';
const KEY_ACTIVE = 'mc-active';

function load(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY_CONVOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Conversation[];
  } catch {
    return [];
  }
}

function save(convos: Conversation[]) {
  try {
    localStorage.setItem(KEY_CONVOS, JSON.stringify(convos));
  } catch {
    // quota exceeded — silently drop; app continues functioning in-memory
  }
}

export function formatDateLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function autoTitle(s: string): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  if (!clean) return 'New chat';
  return clean.length > 36 ? clean.slice(0, 34) + '…' : clean;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => load());
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY_ACTIVE);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const id = window.setTimeout(() => save(conversations), 300);
    return () => window.clearTimeout(id);
  }, [conversations]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(KEY_ACTIVE, activeId);
      else localStorage.removeItem(KEY_ACTIVE);
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [activeId]);

  const setActiveId = useCallback((id: string | null) => setActiveIdState(id), []);

  const createConversation = useCallback((firstMessage?: string): Conversation => {
    const now = Date.now();
    const c: Conversation = {
      id: 'c' + now + '-' + Math.random().toString(36).slice(2, 7),
      title: autoTitle(firstMessage || 'New chat'),
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    setConversations((cs) => [c, ...cs]);
    setActiveIdState(c.id);
    return c;
  }, []);

  const updateConversation = useCallback((id: string, patch: Partial<Conversation>) => {
    setConversations((cs) =>
      cs.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c))
    );
  }, []);

  const appendMessages = useCallback((id: string, msgs: Message[]) => {
    setConversations((cs) =>
      cs.map((c) =>
        c.id === id ? { ...c, messages: [...c.messages, ...msgs], updatedAt: Date.now() } : c
      )
    );
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((cs) => cs.filter((c) => c.id !== id));
      if (activeId === id) setActiveIdState(null);
    },
    [activeId]
  );

  const togglePin = useCallback((id: string) => {
    setConversations((cs) =>
      cs.map((c) => (c.id === id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c))
    );
  }, []);

  const clearAll = useCallback(() => {
    setConversations([]);
    setActiveIdState(null);
  }, []);

  return {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    updateConversation,
    appendMessages,
    deleteConversation,
    togglePin,
    clearAll,
  };
}
