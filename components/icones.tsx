type IconeProps = { className?: string };

const base = "w-[18px] h-[18px]";

export function IconeDashboard({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeClientes({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" strokeLinecap="round" />
      <path d="M15.5 9a2.75 2.75 0 1 0 0-5.5" strokeLinecap="round" />
      <path d="M15 14.7c2.6.3 4.5 2.3 4.5 5.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconeProcessos({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h4l1.5 2h7A1.5 1.5 0 0 1 19.5 9.5v8A1.5 1.5 0 0 1 18 19H5.5A1.5 1.5 0 0 1 4 17.5v-10Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconePrazos({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="1.5" />
      <path d="M4 9.5h16" />
      <path d="M8 3.5v3.5M16 3.5v3.5" strokeLinecap="round" />
      <path d="M8.5 13h2.5M8.5 16h6" strokeLinecap="round" />
    </svg>
  );
}

export function IconeFinanceiro({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M14.5 9.75c0-1-1-1.75-2.5-1.75s-2.5.7-2.5 1.75c0 2.4 5 1.2 5 3.5 0 1.05-1.12 1.75-2.5 1.75s-2.5-.75-2.5-1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeConfiguracoes({ className = base }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <circle cx="12" cy="12" r="2.75" />
      <path
        d="M19.4 13.5a1.5 1.5 0 0 0 .3 1.65l.05.05a1.8 1.8 0 1 1-2.55 2.55l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37V19a1.8 1.8 0 1 1-3.6 0v-.08a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.05.05a1.8 1.8 0 1 1-2.55-2.55l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H4.5a1.8 1.8 0 1 1 0-3.6h.08a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.05-.05A1.8 1.8 0 1 1 8.15 5.7l.05.05a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .9-1.37V4.5a1.8 1.8 0 1 1 3.6 0v.08a1.5 1.5 0 0 0 .9 1.37h.07a1.5 1.5 0 0 0 1.65-.3l.05-.05a1.8 1.8 0 1 1 2.55 2.55l-.05.05a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9h.08a1.8 1.8 0 1 1 0 3.6h-.08a1.5 1.5 0 0 0-1.37.9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
