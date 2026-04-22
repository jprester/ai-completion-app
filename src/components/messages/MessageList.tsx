import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import Copy from '../../assets/icons/Copy';
import type { Message } from '../../hooks/useConversations';

function sanitizeHtml(content: string): string {
  const rawHtml = marked(content) as string;
  return DOMPurify.sanitize(rawHtml);
}

type Props = {
  messages: Message[];
  isLoading: boolean;
  onCopy: (content: string) => void;
};

export default function MessageList({ messages, isLoading, onCopy }: Props) {
  const grouped = useMemo<React.ReactNode[]>(() => {
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role === 'user') {
        const next = messages[i + 1];
        const image = next && next.role === 'user' && next.type === 'image' ? next : null;
        if (image) i++;
        nodes.push(
          <div key={i} className="msg user">
            <div className="msg-label">You</div>
            {image && <img src={image.content} className="msg-image" alt="Uploaded" />}
            {m.type === 'text' && m.content && (
              <div className="msg-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.content) }} />
            )}
            {m.type === 'image' && !image && <img src={m.content} className="msg-image" alt="Uploaded" />}
          </div>
        );
      } else if (m.role === 'assistant' && m.content) {
        nodes.push(
          <div key={i} className="msg assistant">
            <div className="msg-label">Assistant</div>
            <div className="msg-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.content) }} />
            <div className="msg-actions">
              <button className="msg-action" onClick={() => onCopy(m.content)} aria-label="Copy message">
                <Copy size={11} /> copy
              </button>
            </div>
          </div>
        );
      }
    }
    return nodes;
  }, [messages, onCopy]);

  return (
    <div className="messages-container">
      {grouped}
      {isLoading && (
        <div className="msg assistant">
          <div className="msg-label">Assistant</div>
          <div className="msg-loading">
            <span className="dot" /> Thinking…
          </div>
        </div>
      )}
    </div>
  );
}
