import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Settings = {
  theme: ThemeMode;
  accent: string;
  textModel: string;
  imageModel: string;
};

export const ACCENT_PRESETS: Array<{ name: string; value: string }> = [
  { name: 'Brick', value: '#c96442' },
  { name: 'Ink', value: '#1f1d1a' },
  { name: 'Olive', value: '#6a7a3a' },
  { name: 'Blue', value: '#4a6fa5' },
  { name: 'Plum', value: '#7a3a6a' },
];

export const MODEL_PRESETS: Array<{ provider: string; text: string[]; image: string[] }> = [
  {
    provider: 'Mistral',
    text: ['mistral-tiny', 'mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
    image: ['pixtral-12b-2409'],
  },
  {
    provider: 'OpenAI',
    text: ['gpt-4o-mini', 'gpt-4o'],
    image: ['gpt-4o'],
  },
  {
    provider: 'Anthropic',
    text: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-7'],
    image: ['claude-sonnet-4-6', 'claude-opus-4-7'],
  },
];

const KEY = 'mc-settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  accent: '#c96442',
  textModel: 'mistral-tiny',
  imageModel: 'pixtral-12b-2409',
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // ignore quota errors
    }
  }, [settings]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((s) => ({ ...s, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  return { settings, setSettings, resetSettings };
}
