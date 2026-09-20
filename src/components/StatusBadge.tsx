import React from "react";

const STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CASH: "bg-amber-50 text-amber-700 ring-amber-600/20",
  INVOICED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      STYLES[status] ?? "bg-slate-50 text-slate-600 ring-slate-500/20"
    }`}
  >
    {status.charAt(0) + status.slice(1).toLowerCase()}
  </span>
);

export default StatusBadge;