"use client";

// components/Sidebar.tsx
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/store";
import {
  fetchJobs,
  setSelectedJob,
} from "@/lib/features/jobs/jobsSlice";
import { formatDate } from "@/lib/format";
import StatusBadge from "./StatusBadge";

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, selectedJob, status } = useSelector(
    (state: RootState) => state.jobs
  );
  const [searchTerm, setSearchTerm] = useState<string>("");

  const openAuthWindow = () => {
    const authWindow = window.open(
      "/api/myob/auth",
      "_blank",
      "width=600,height=600"
    );

    if (!authWindow) {
      alert("Popup blocked! Please allow popups for this site.");
    }
  };

  // Newest first, then apply the search filter.
  const filteredJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return [...jobs]
      .sort((a, b) => (b.dateOut || "").localeCompare(a.dateOut || ""))
      .filter(
        (job) =>
          !term ||
          job.serviceString?.toLowerCase().includes(term) ||
          job.Customer?.name?.toLowerCase().includes(term) ||
          job.Vehicle?.registration?.toLowerCase().includes(term)
      );
  }, [jobs, searchTerm]);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand + actions */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              AHVW
            </h1>
            <p className="text-xs text-slate-500">MYOB Invoice Tool</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(fetchJobs())}
            disabled={status === "loading"}
            title="Reload jobs"
            aria-label="Reload jobs"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <svg
              className={`h-5 w-5 ${status === "loading" ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5M5.6 15A8 8 0 0018.4 9M18.4 9L20 9M5.6 15L4 15"
              />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={openAuthWindow}
          className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Refresh MYOB login
        </button>

        <div className="relative mt-3">
          <svg
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="Search service, customer or rego"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
        </p>
      </div>

      {/* Job list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {status === "loading" && jobs.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">
            Loading jobs…
          </p>
        ) : filteredJobs.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">
            No jobs match your search.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredJobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => dispatch(setSelectedJob(job))}
                    className={`block w-full border-l-2 px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {job.serviceString}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate">
                        {job.Customer?.name} · {job.Vehicle?.registration}
                      </span>
                      <span className="ml-2 shrink-0">
                        {formatDate(job.dateOut)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;