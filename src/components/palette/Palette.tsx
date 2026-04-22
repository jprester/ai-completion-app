import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import Search from '../../assets/icons/Search';
import Clock from '../../assets/icons/Clock';
import { QUICK_ACTIONS } from '../../quickActions';
import type { Conversation } from '../../hooks/useConversations';
import { formatDateLabel } from '../../hooks/useConversations';
import './Palette.css';

type PromptItem = {
  kind: 'prompt';
  id: string;
  label: string;
  kbd: string;
  Icon: FC<{ size?: number }>;
};
type ChatItem = {
  kind: 'chat';
  id: string;
  label: string;
  desc: string;
};
type Item = PromptItem | ChatItem;

type Props = {
  open: boolean;
  onClose: () => void;
  onRunPrompt: (id: string) => void;
  onOpenChat: (id: string) => void;
  conversations: Conversation[];
};

export default function Palette({ open, onClose, onRunPrompt, onOpenChat, conversations }: Props) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const items: Item[] = useMemo(() => {
    const lower = q.toLowerCase().trim();
    const prompts: PromptItem[] = QUICK_ACTIONS.filter(
      (a) => !lower || a.label.toLowerCase().includes(lower)
    ).map((a) => ({ kind: 'prompt', id: a.id, label: a.label, kbd: a.kbd, Icon: a.Icon }));
    const chats: ChatItem[] = conversations
      .filter((c) => !lower || c.title.toLowerCase().includes(lower))
      .slice(0, 6)
      .map((c) => ({
        kind: 'chat',
        id: c.id,
        label: c.title,
        desc: formatDateLabel(c.updatedAt),
      }));
    return [...prompts, ...chats];
  }, [q, conversations]);

  useEffect(() => setIdx(0), [q]);

  if (!open) return null;

  const run = (item: Item | undefined) => {
    if (!item) return;
    if (item.kind === 'prompt') onRunPrompt(item.id);
    else onOpenChat(item.id);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(items[idx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const prompts = items.filter((i): i is PromptItem => i.kind === 'prompt');
  const chats = items.filter((i): i is ChatItem => i.kind === 'chat');

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="palette-input">
          <span className="palette-input-icon">
            <Search size={18} />
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search prompts, chats…"
            aria-label="Search"
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list">
          {prompts.length > 0 && <div className="palette-group-title">Quick actions</div>}
          {prompts.map((item) => {
            const absIdx = items.indexOf(item);
            const Icon = item.Icon;
            return (
              <button
                key={`p-${item.id}`}
                type="button"
                className={`palette-item ${absIdx === idx ? 'active' : ''}`}
                onMouseEnter={() => setIdx(absIdx)}
                onClick={() => run(item)}
              >
                <span className="palette-ico">
                  <Icon size={15} />
                </span>
                <span className="palette-main">{item.label}</span>
                <kbd>{item.kbd}</kbd>
              </button>
            );
          })}
          {chats.length > 0 && <div className="palette-group-title">Recent chats</div>}
          {chats.map((item) => {
            const absIdx = items.indexOf(item);
            return (
              <button
                key={`c-${item.id}`}
                type="button"
                className={`palette-item ${absIdx === idx ? 'active' : ''}`}
                onMouseEnter={() => setIdx(absIdx)}
                onClick={() => run(item)}
              >
                <span className="palette-ico">
                  <Clock size={15} />
                </span>
                <span className="palette-main">{item.label}</span>
                <span className="palette-desc">{item.desc}</span>
              </button>
            );
          })}
          {items.length === 0 && <div className="palette-empty">No matches.</div>}
        </div>
        <div className="palette-footer">
          <span>
            <kbd>↑↓</kbd> navigate <kbd>↵</kbd> run
          </span>
          <span>{items.length} results</span>
        </div>
      </div>
    </div>
  );
}
