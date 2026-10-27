const P = ({ s = 22, children, ...r }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...r}>{children}</svg>
);
export const SplitIcon = (p) => <P {...p}><path d="M12 3v7M12 10l-6 5v6M12 10l6 5v6" /></P>;
export const UsersIcon = (p) => <P {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 010 7M18 14c2.2.6 3.5 2.6 3.5 6" /></P>;
export const ListIcon = (p) => <P {...p}><path d="M9 6h12M9 12h12M9 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></P>;
export const GearIcon = (p) => <P {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" /></P>;
export const SearchIcon = (p) => <P {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></P>;
export const PlusIcon = (p) => <P {...p}><path d="M12 5v14M5 12h14" /></P>;
export const TrashIcon = (p) => <P {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></P>;
export const CheckIcon = (p) => <P {...p}><path d="M4 12.5l5 5L20 6.5" /></P>;
export const ClockIcon = (p) => <P {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></P>;
export const LockIcon = (p) => <P {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></P>;
export const RefreshIcon = (p) => <P {...p}><path d="M20 11a8 8 0 00-14-4L4 9M4 4v5h5M4 13a8 8 0 0014 4l2-2M20 20v-5h-5" /></P>;
export const CopyIcon = (p) => <P {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 012-2h9" /></P>;
export const ChatIcon = (p) => <P {...p}><path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z" /></P>;
