import { useEffect, useMemo, useState } from 'react';
import X from '../../assets/icons/X';
import Sun from '../../assets/icons/Sun';
import Moon from '../../assets/icons/Moon';
import {
  ACCENT_PRESETS,
  MODEL_PRESETS,
  type Settings,
  type ThemeMode,
} from '../../hooks/useSettings';
import { useOpenRouterModels } from '../../hooks/useOpenRouterModels';
import type { OpenRouterModel } from '../../services/api';
import './Settings.css';

const OPENROUTER = 'openrouter';

function OpenRouterPicker({
  mode,
  models,
  loading,
  error,
  selected,
  onSelect,
}: {
  mode: 'text' | 'image';
  models: OpenRouterModel[];
  loading: boolean;
  error: string | null;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = models;
    if (mode === 'image') list = list.filter((m) => m.supports_images);
    if (freeOnly) list = list.filter((m) => m.is_free);
    const lower = q.trim().toLowerCase();
    if (lower) {
      list = list.filter(
        (m) => m.id.toLowerCase().includes(lower) || m.name.toLowerCase().includes(lower)
      );
    }
    return list.slice(0, 60);
  }, [models, mode, freeOnly, q]);

  return (
    <div className="or-picker">
      <div className="or-picker-toolbar">
        <input
          type="text"
          className="or-picker-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search OpenRouter models…"
          spellCheck={false}
          autoComplete="off"
        />
        <label className="or-picker-toggle">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
          />
          Free only
        </label>
      </div>
      <div className="or-picker-list">
        {loading && models.length === 0 && (
          <div className="or-picker-status">Loading models…</div>
        )}
        {error && models.length === 0 && <div className="or-picker-status">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="or-picker-status">No matches</div>
        )}
        {filtered.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`or-item ${selected === m.id ? 'active' : ''}`}
            onClick={() => onSelect(m.id)}
            title={m.name}
          >
            <span className="or-item-id">{m.id}</span>
            {m.is_free && <span className="or-item-badge">Free</span>}
            {m.context_length ? (
              <span className="or-item-ctx">{Math.round(m.context_length / 1000)}k</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onClearConversations: () => void;
  conversationCount: number;
};

export default function SettingsModal({
  open,
  onClose,
  settings,
  onChange,
  onReset,
  onClearConversations,
  conversationCount,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const needsOpenRouter =
    open && (settings.textProvider === OPENROUTER || settings.imageProvider === OPENROUTER);
  const { models: orModels, loading: orLoading, error: orError } =
    useOpenRouterModels(needsOpenRouter);

  if (!open) return null;

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div
        className="settings-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            <X size={16} />
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3>Appearance</h3>

            <div className="settings-row">
              <label className="settings-label">Theme</label>
              <div className="theme-group" role="radiogroup" aria-label="Theme mode">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`theme-option ${settings.theme === mode ? 'active' : ''}`}
                    onClick={() => onChange({ theme: mode })}
                    role="radio"
                    aria-checked={settings.theme === mode}
                  >
                    {mode === 'light' && <Sun size={14} />}
                    {mode === 'dark' && <Moon size={14} />}
                    {mode === 'system' && <span className="theme-option-dot" />}
                    <span>{mode[0].toUpperCase() + mode.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <label className="settings-label">Accent</label>
              <div className="accent-group">
                {ACCENT_PRESETS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    className={`accent-swatch ${settings.accent === a.value ? 'active' : ''}`}
                    style={{ background: a.value }}
                    onClick={() => onChange({ accent: a.value })}
                    aria-label={`Accent: ${a.name}`}
                    title={a.name}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3>Model</h3>

            <div className="settings-field">
              <div className="settings-field-header">
                <label className="settings-label" htmlFor="text-model">
                  Text model
                </label>
                <select
                  className="provider-select"
                  value={settings.textProvider}
                  onChange={(e) => onChange({ textProvider: e.target.value })}
                  aria-label="Text provider"
                >
                  {MODEL_PRESETS.map((p) => (
                    <option key={p.provider} value={p.provider}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                id="text-model"
                type="text"
                className="settings-input"
                value={settings.textModel}
                onChange={(e) => onChange({ textModel: e.target.value })}
                placeholder="mistral-tiny"
                spellCheck={false}
                autoComplete="off"
              />
              {settings.textProvider === OPENROUTER ? (
                <OpenRouterPicker
                  mode="text"
                  models={orModels}
                  loading={orLoading}
                  error={orError}
                  selected={settings.textModel}
                  onSelect={(m) => onChange({ textModel: m })}
                />
              ) : (
                <div className="settings-presets">
                  {MODEL_PRESETS.find((p) => p.provider === settings.textProvider)?.text.map(
                    (m) => (
                      <button
                        key={`${settings.textProvider}-${m}`}
                        type="button"
                        className={`preset-chip ${settings.textModel === m ? 'active' : ''}`}
                        onClick={() => onChange({ textModel: m })}
                        title={`${settings.textProvider} · ${m}`}
                      >
                        {m}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="settings-field">
              <div className="settings-field-header">
                <label className="settings-label" htmlFor="image-model">
                  Image model
                </label>
                <select
                  className="provider-select"
                  value={settings.imageProvider}
                  onChange={(e) => onChange({ imageProvider: e.target.value })}
                  aria-label="Image provider"
                >
                  {MODEL_PRESETS.map((p) => (
                    <option key={p.provider} value={p.provider}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                id="image-model"
                type="text"
                className="settings-input"
                value={settings.imageModel}
                onChange={(e) => onChange({ imageModel: e.target.value })}
                placeholder="pixtral-12b-2409"
                spellCheck={false}
                autoComplete="off"
              />
              {settings.imageProvider === OPENROUTER ? (
                <OpenRouterPicker
                  mode="image"
                  models={orModels}
                  loading={orLoading}
                  error={orError}
                  selected={settings.imageModel}
                  onSelect={(m) => onChange({ imageModel: m })}
                />
              ) : (
                <div className="settings-presets">
                  {MODEL_PRESETS.find((p) => p.provider === settings.imageProvider)?.image.map(
                    (m) => (
                      <button
                        key={`${settings.imageProvider}-img-${m}`}
                        type="button"
                        className={`preset-chip ${settings.imageModel === m ? 'active' : ''}`}
                        onClick={() => onChange({ imageModel: m })}
                        title={`${settings.imageProvider} · ${m}`}
                      >
                        {m}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <p className="settings-help">
              Provider and model are passed directly to your backend. Support depends on how your
              server routes them.
            </p>
          </section>

          <section className="settings-section">
            <h3>Data</h3>

            <div className="settings-row">
              <div>
                <div className="settings-label">Conversations</div>
                <div className="settings-help">
                  {conversationCount} saved locally in this browser.
                </div>
              </div>
              <button
                type="button"
                className="btn-danger"
                onClick={onClearConversations}
                disabled={conversationCount === 0}
              >
                Clear all
              </button>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">Reset preferences</div>
                <div className="settings-help">Restore theme, accent, and model defaults.</div>
              </div>
              <button type="button" className="btn-secondary" onClick={onReset}>
                Reset
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
