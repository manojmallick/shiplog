export function MockBanner() {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2"
      role="status"
    >
      <span className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9-3a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 7.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v3.25h.25a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1 0-1.5h.25V8.25H7.5a.75.75 0 0 1-.75-.75Z" />
        </svg>
      </span>
      <p>
        <span className="font-semibold">Mock mode</span> — no Aurora DSQL endpoint configured. Data
        is served from in-memory state and resets on server restart. Region badges reflect the demo
        lens, not real cross-region writes.
      </p>
    </div>
  );
}
