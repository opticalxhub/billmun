import React from 'react';

type CommitteeCommandHeaderProps = {
  user: any;
  committee: any;
  sessionState: string;
  setSessionState: React.Dispatch<React.SetStateAction<string>>;
};

export default function CommitteeCommandHeader({
  user,
  committee,
  sessionState,
  setSessionState,
}: CommitteeCommandHeaderProps) {
  const committeeName = committee?.name || 'Committee';
  const committeeTopic = committee?.topic || '';

  return (
    <div className="p-6 border border-border-subtle rounded-card bg-bg-card">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-jotia font-bold uppercase tracking-tight">{committeeName}</h2>
          {committeeTopic ? <p className="text-text-secondary mt-2 text-sm">{committeeTopic}</p> : null}
          <p className="text-text-tertiary mt-2 text-xs">
            Chair: {user?.full_name || '—'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            'In Session',
            'Moderated Caucus',
            'Unmoderated Caucus',
            'On Break',
            'Adjourned',
          ].map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setSessionState(state)}
              className={`px-3 py-2 border rounded-button text-xs font-semibold transition-colors ${
                sessionState === state
                  ? 'bg-bg-raised border-border-emphasized text-text-primary'
                  : 'bg-bg-base border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-raised'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-text-secondary">
        Current status: <span className="text-text-primary font-medium">{sessionState}</span>
      </div>
    </div>
  );
}
