'use client';

import React from 'react';
import clsx from 'clsx';
import { TextInput } from './field';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantPanelProps {
  open: boolean;
  onToggle: () => void;
  available: boolean;
  messages: AssistantMessage[];
  waiting: boolean;
  input: string;
  onInput: (value: string) => void;
  onSend: (question?: string) => void;
  suggested?: string[];
  summary: string;
}

/**
 * The plain-language AI Score Assistant, rendered as a collapsed-by-default
 * panel in the page's own type and colour system — never a floating chat
 * widget with its own skin.
 */
export function AssistantPanel({
  open,
  onToggle,
  available,
  messages,
  waiting,
  input,
  onInput,
  onSend,
  suggested,
  summary,
}: AssistantPanelProps) {
  return (
    <section className="border border-paper-line bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-indigo-tint"
      >
        <span className="text-[13px] font-semibold text-ink">Score Assistant — plain-language answers about your assessment</span>
        <span className="text-indigo text-xs font-mono">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="border-t border-paper-line px-4 py-4 space-y-3">
          <p className="text-[13px] text-ink-soft leading-relaxed">{summary}</p>

          {messages.length === 0 && suggested && suggested.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-ink-mute uppercase tracking-widest">Ask about</p>
              {suggested.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={!available || waiting}
                  onClick={() => onSend(q)}
                  className="block w-full text-left text-[13px] text-indigo border border-paper-line px-3 py-2 transition-colors hover:bg-indigo-tint disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={clsx(
                  'max-w-[85%] px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap border',
                  m.role === 'user'
                    ? 'ml-auto bg-indigo border-indigo text-paper'
                    : 'bg-paper-tile border-paper-line text-ink'
                )}
              >
                {m.content}
              </div>
            ))}
            {waiting && (
              <div className="max-w-[85%] px-3 py-2 text-[13px] text-ink-mute bg-paper-tile border border-paper-line">
                Thinking…
              </div>
            )}
          </div>

          {!available && messages.length === 0 && (
            <p className="text-[13px] text-ink-soft">
              The assistant is not enabled on this deployment yet. Your roadmap and suggestions above still explain what to do.
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <TextInput
              value={input}
              disabled={!available || waiting}
              placeholder={available ? 'Ask about your score…' : 'Assistant unavailable'}
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSend();
              }}
            />
            <button
              type="button"
              disabled={!available || waiting || !input.trim()}
              onClick={() => onSend()}
              className="btn btn-quiet shrink-0"
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </section>
  );
}