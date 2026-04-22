import type { FC } from 'react';
import Pen from './assets/icons/Pen';
import Book from './assets/icons/Book';
import Check from './assets/icons/Check';
import Bolt from './assets/icons/Bolt';
import Image from './assets/icons/Image';

export type ChatOption =
  | 'summarize'
  | 'proofread'
  | 'factcheck'
  | 'brainstorm'
  | 'image-recognition'
  | null;

type IconProps = { size?: number };

export type QuickAction = {
  id: Exclude<ChatOption, null>;
  label: string;
  kbd: string;
  Icon: FC<IconProps>;
  prompt: (userText: string) => string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'proofread',
    label: 'Proofread',
    kbd: '⌘1',
    Icon: Pen,
    prompt: (t) =>
      `Please proofread and fix spelling, grammar and style of the following text:\n\n${t}`,
  },
  {
    id: 'summarize',
    label: 'Summarize',
    kbd: '⌘2',
    Icon: Book,
    prompt: (t) => `Please summarize the following text:\n\n${t}`,
  },
  {
    id: 'factcheck',
    label: 'Fact-check',
    kbd: '⌘3',
    Icon: Check,
    prompt: (t) =>
      `Please fact-check the following claim and cite whether it is accurate, inaccurate, or requires more context:\n\n${t}`,
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    kbd: '⌘4',
    Icon: Bolt,
    prompt: (t) => `Brainstorm 10 ideas for:\n\n${t}`,
  },
  {
    id: 'image-recognition',
    label: 'Describe image',
    kbd: '⌘5',
    Icon: Image,
    prompt: (t) => t || 'Please provide a description of the image',
  },
];

export function getAction(id: ChatOption): QuickAction | undefined {
  if (!id) return undefined;
  return QUICK_ACTIONS.find((a) => a.id === id);
}
