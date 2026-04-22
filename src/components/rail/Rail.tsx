import { memo, useMemo } from 'react';
import Menu from '../../assets/icons/Menu';
import Plus from '../../assets/icons/Plus';
import Search from '../../assets/icons/Search';
import Star from '../../assets/icons/Star';
import type { Conversation } from '../../hooks/useConversations';
import { formatDateLabel } from '../../hooks/useConversations';
import './Rail.css';

type Props = {
  expanded: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onSearch: () => void;
};

function Rail({ expanded, onToggle, conversations, activeId, onSelect, onNew, onSearch }: Props) {
  const groups = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      return b.updatedAt - a.updatedAt;
    });
    const map = new Map<string, Conversation[]>();
    for (const c of sorted) {
      const label = c.pinned ? 'Pinned' : formatDateLabel(c.updatedAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(c);
    }
    return [...map.entries()];
  }, [conversations]);

  return (
    <aside className={`rail ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="rail-top">
        <button
          className="rail-toggle"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          title={expanded ? 'Collapse sidebar (⌘\\)' : 'Expand sidebar (⌘\\)'}
        >
          <Menu />
        </button>
        <span className="rail-brand">master-chat</span>
      </div>

      <div className="rail-nav">
        <button className="rail-btn primary" onClick={onNew} title="New chat (⌘N)">
          <span className="rail-btn-icon">
            <Plus />
          </span>
          <span className="rail-btn-label">New chat</span>
          <span className="rail-btn-kbd">⌘N</span>
        </button>
        <button className="rail-btn" onClick={onSearch} title="Search (⌘K)">
          <span className="rail-btn-icon">
            <Search />
          </span>
          <span className="rail-btn-label">Search</span>
          <span className="rail-btn-kbd">⌘K</span>
        </button>
      </div>

      <div className="rail-list">
        {groups.map(([label, items]) => (
          <div key={label} className="rail-group">
            <div className="rail-section">{label}</div>
            {items.map((c) => (
              <div
                key={c.id}
                className={`convo-row ${c.id === activeId ? 'active' : ''}`}
                onClick={() => onSelect(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(c.id);
                  }
                }}
                title={c.title}
              >
                {c.pinned && (
                  <span className="convo-pin" role="img" aria-label="Pinned">
                    <Star size={12} />
                  </span>
                )}
                <span className="convo-title">{c.title}</span>
                {label !== 'Today' && label !== 'Pinned' && (
                  <span className="convo-date">{formatDateLabel(c.updatedAt)}</span>
                )}
              </div>
            ))}
          </div>
        ))}
        {conversations.length === 0 && expanded && (
          <div className="rail-empty">No chats yet. Start one above.</div>
        )}
      </div>
    </aside>
  );
}

export default memo(Rail);
