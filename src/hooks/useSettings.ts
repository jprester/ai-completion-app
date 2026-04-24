import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Settings = {
  theme: ThemeMode;
  accent: string;
  textProvider: string;
  textModel: string;
  imageProvider: string;
  imageModel: string;
};

export const ACCENT_PRESETS: Array<{ name: string; value: string }> = [
  { name: 'Brick', value: '#c96442' },
  { name: 'Ink', value: '#1f1d1a' },
  { name: 'Olive', value: '#6a7a3a' },
  { name: 'Blue', value: '#4a6fa5' },
  { name: 'Plum', value: '#7a3a6a' },
];

export const MODEL_PRESETS: Array<{ provider: string; label: string; text: string[]; image: string[] }> = [
  {
    provider: 'deepseek',
    label: 'DeepSeek',
    text: ['deepseek-v4-flash', 'deepseek-v4-pro'],
    image: [],
  },
  {
    provider: 'mistral',
    label: 'Mistral',
    text: ['mistral-tiny', 'mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
    image: ['pixtral-12b-2409'],
  },
  {
    provider: 'anthropic',
    label: 'Anthropic',
    text: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-7'],
    image: ['claude-sonnet-4-6', 'claude-opus-4-7'],
  },
  {
    provider: 'openrouter',
    label: 'OpenRouter',
    text: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'openai/gpt-4o-mini'],
    image: ['google/gemini-2.5-flash', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
  },
];

function inferProvider(model: string): string {
  const lower = model.toLowerCase();
  if (lower.startsWith('deepseek-')) return 'deepseek';
  if (lower.startsWith('mistral-') || lower.startsWith('pixtral-')) return 'mistral';
  if (lower.startsWith('claude-')) return 'anthropic';
  return 'openrouter';
}

const KEY = 'mc-settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  accent: '#c96442',
  textProvider: 'deepseek',
  textModel: 'deepseek-v4-flash',
  imageProvider: 'openrouter',
  imageModel: 'google/gemini-2.5-flash',
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const merged: Settings = { ...DEFAULT_SETTINGS, ...parsed };
    // Backward compat: older settings didn't store provider
    if (!parsed.textProvider && merged.textModel) {
      merged.textProvider = inferProvider(merged.textModel);
    }
    if (!parsed.imageProvider && merged.imageModel) {
      merged.imageProvider = inferProvider(merged.imageModel);
    }
    return merged;
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
