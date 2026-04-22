import { useEffect } from 'react';
import type { DependencyList } from 'react';

type Handler = (e: KeyboardEvent) => void;
type HotkeyMap = Record<string, Handler>;

/**
 * Normalized combos: "mod+k", "mod+n", "mod+\\", "mod+1", "escape".
 * `mod` matches either Meta (⌘) or Ctrl.
 */
export function useHotkeys(map: HotkeyMap, deps: DependencyList = []) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const combo = `${mod ? 'mod+' : ''}${key}`;
      const handler = map[combo] || map[key];
      if (handler) handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
