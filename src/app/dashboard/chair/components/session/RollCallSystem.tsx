export default function RollCallSystem({ committee }: { committee: any }) {
  return (
    <div className="p-4 border rounded shadow-sm bg-bg-card">
      <h2 className="text-xl font-bold">Roll Call System</h2>
      <p className="text-text-secondary text-sm">
        Committee: {committee?.abbreviation || committee?.name || '—'}
      </p>
    </div>
  );
}
