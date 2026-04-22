import { useEffect, useState } from 'react';
import { fetchOpenRouterModels, type OpenRouterModel } from '../services/api';

const CACHE_KEY = 'mc-openrouter-models';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type Cached = { data: OpenRouterModel[]; fetched_at: number };

function loadCache(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (!parsed?.data || !Array.isArray(parsed.data)) return null;
    // fetched_at is Unix seconds (from backend); convert to ms for comparison
    if (Date.now() - parsed.fetched_at * 1_000 > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useOpenRouterModels(enabled: boolean) {
  const [models, setModels] = useState<OpenRouterModel[]>(() => loadCache()?.data ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (loadCache()) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchOpenRouterModels(controller.signal)
      .then((res) => {
        setModels(res.data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(res));
        } catch {
          // ignore quota errors
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load models');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [enabled]);

  return { models, loading, error };
}
