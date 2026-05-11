const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-500" },
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  paused: { label: "Paused", className: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-700" },
  expired: { label: "Expired", className: "bg-red-100 text-red-500" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
  declined: { label: "Declined", className: "bg-red-100 text-red-600" },
  withdrawn: { label: "Withdrawn", className: "bg-slate-100 text-slate-400" },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: "bg-slate-100 text-slate-500" };
  return (
    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}
