import { useEffect } from 'react';
import type { DependencyList } from 'react';

type Handler = (e: KeyboardEvent) => void;
type HotkeyMap = Record<string, Handler>;

/**
 * Normalized combos: "mod+k", "mod+n", "mod+\\", "mod+1", "escape".
 * `mod` matches either Meta (⌘) or Ctrl.
 */
function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable;
}

export function useHotkeys(map: HotkeyMap, deps: DependencyList = []) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      // Escape always fires (universal "dismiss" affordance); bare keys are
      // otherwise suppressed while typing in inputs/textareas.
      if (!mod && key !== 'escape' && isTypingTarget(e.target)) return;
      const combo = `${mod ? 'mod+' : ''}${key}`;
      const handler = map[combo] || map[key];
      if (handler) handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
