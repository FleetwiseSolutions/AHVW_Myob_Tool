"use client";

import {
  fetchJobs,
  Job,
  updateJobInvoiceId,
} from "@/lib/features/jobs/jobsSlice";
import { AppDispatch, RootState } from "@/lib/store";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import CommentPicker from "./CommentPicker";
import StatusBadge from "./StatusBadge";
import { COMMENT_PRESETS, resolveComment } from "@/lib/commentPresets";
import { formatDate, formatMoney, round2 } from "@/lib/format";

export const JobMap = (jobType: string) => {
  switch (jobType) {
    case "C_SERVICE":
      return "C Service";
    case "A_SERVICE":
      return "A Service";
    case "B_SERVICE":
      return "B Service";
    default:
      return jobType;
  }
};

const VehicleTypeMap = (vehicleType: string) => {
  switch (vehicleType) {
    case "ATAUTLINER":
      return "A Trailer Tautliner";
    case "BTAUTLINER":
      return "B Trailer Tautliner";
    case "AREFER":
      return "A Refrigerator Trailer";
    case "BREFER":
      return "B Refrigerator Trailer";
    case "TIPPER":
      return "Tipper Trailer";
    case "DOG":
      return "Dog Trailer";
    default:
      return vehicleType;
  }
};

type Feedback = { kind: "success" | "warning" | "error"; text: string };

const FEEDBACK_STYLES: Record<Feedback["kind"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

const Card: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <section
    className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
  >
    {title && (
      <h3 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-900">
        {title}
      </h3>
    )}
    <div className="p-6">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd className="mt-1 text-sm text-slate-900">{children || "—"}</dd>
  </div>
);

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

const CenteredMessage: React.FC<{
  title: string;
  body?: string;
  children?: React.ReactNode;
}> = ({ title, body, children }) => (
  <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-6 text-center">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z"
        />
      </svg>
    </div>
    <p className="text-base font-medium text-slate-900">{title}</p>
    {body && <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
    {children}
  </div>
);

const JobDetails: React.FC = () => {
  const { selectedJob } = useSelector((state: RootState) => state.jobs);
  const dispatch = useDispatch<AppDispatch>();
  const { status, error } = useSelector((state: RootState) => state.jobs);
  const [loadingAction, setLoadingAction] = useState<"create" | "email" | null>(
    null
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [commentId, setCommentId] = useState<string>(COMMENT_PRESETS[0].id);
  const [customComment, setCustomComment] = useState("");

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  // Don't carry a previous job's result message over to the next job.
  const selectedJobId = selectedJob?.id;
  useEffect(() => {
    setFeedback(null);
  }, [selectedJobId]);

  // Returns true if the job was marked as invoiced in the database.
  const updateInvoiceId = async (job: Job, invoiceId: string) => {
    const updatedJob = { ...job, invoiceId };
    const resultAction = await dispatch(updateJobInvoiceId(updatedJob));

    if (updateJobInvoiceId.fulfilled.match(resultAction)) {
      return true;
    }
    console.error("Failed to update job:", resultAction);
    return false;
  };

  if (status === "loading") {
    return <CenteredMessage title="Loading jobs…" />;
  }

  if (status === "failed") {
    return (
      <CenteredMessage title="Couldn't load jobs" body={error ?? undefined}>
        <button
          type="button"
          onClick={() => dispatch(fetchJobs())}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Try again
        </button>
      </CenteredMessage>
    );
  }

  if (!selectedJob) {
    return (
      <CenteredMessage
        title="Select a job"
        body="Choose a job from the list to review it and create its invoice."
      />
    );
  }

  const parts = selectedJob.JobPart ?? [];
  const subtotal = round2(
    parts.reduce((sum, part) => sum + part.sellPrice * part.quantity, 0)
  );
  const gst = round2(subtotal * 0.1);
  const total = round2(subtotal + gst);

  const alreadyInvoiced =
    !!selectedJob.invoiceId || selectedJob.status === "INVOICED";
  const busy = loadingAction !== null;

  // Creates the invoice in MYOB (optionally emailing it) and marks the job.
  const submitInvoice = async (sendEmail: boolean) => {
    setLoadingAction(sendEmail ? "email" : "create");
    setFeedback(null);

    try {
      const response = await fetch("/api/myob/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: selectedJob.Customer.name,
          jobDate: selectedJob.dateOut || new Date(),
          vehicleRegistration: selectedJob.Vehicle.registration,
          customerJobDueDateType: selectedJob.Customer.jobDueDateType,
          customerBalanceDueDate: selectedJob.Customer.balanceDueDate,
          parts: parts.map((part) => ({
            name: part.Part.manufacturingPartNumber,
            quantity: part.quantity,
            price: parseFloat(part.sellPrice.toFixed(2)),
            description: `${part.Part.invoiceDisplay} ${
              part.comments ? ` - ${part.comments}` : ""
            }`,
            Part: part.Part,
          })),
          jobType: JobMap(selectedJob.type),
          jobDescription: {
            registration: selectedJob.vehicleRegistration,
            odometer: selectedJob.odometer || "N/A",
            vehicleType: VehicleTypeMap(selectedJob.Vehicle.type),
          },
          customerComments: selectedJob.inspectionComments,
          invoiceComment: resolveComment(commentId, customComment),
          sendEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          kind: "error",
          text: `Error creating invoice: ${data.error ?? response.statusText}`,
        });
        return;
      }

      const saved = await updateInvoiceId(selectedJob, data.invoiceNumber);

      if (!saved) {
        setFeedback({
          kind: "warning",
          text: `Invoice ${data.invoiceNumber} was created in MYOB, but the job could not be marked as invoiced. Don't create it again — update the job manually.`,
        });
      } else if (sendEmail && data.emailSent === false) {
        setFeedback({
          kind: "warning",
          text: `Invoice ${data.invoiceNumber} was created, but the email failed to send. You can send it from MYOB.`,
        });
      } else {
        setFeedback({
          kind: "success",
          text: `Invoice ${data.invoiceNumber} created${
            sendEmail ? " and emailed" : ""
          }.`,
        });
      }
    } catch (err) {
      setFeedback({
        kind: "error",
        text: `Failed to create invoice. ${
          err instanceof Error ? err.message : ""
        }`,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      {/* Header */}
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {selectedJob.serviceString}
          </h2>
          <StatusBadge status={selectedJob.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {selectedJob.Customer.name} · {selectedJob.Vehicle.registration}
        </p>
      </header>

      {/* Job info */}
      <Card title="Job details">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          <Field label="Customer">{selectedJob.Customer.name}</Field>
          <Field label="Vehicle">{selectedJob.Vehicle.registration}</Field>
          <Field label="Vehicle type">
            {VehicleTypeMap(selectedJob.Vehicle.type)}
          </Field>
          <Field label="Service type">{JobMap(selectedJob.type)}</Field>
          <Field label="Date in">{formatDate(selectedJob.dateIn)}</Field>
          <Field label="Date out">{formatDate(selectedJob.dateOut)}</Field>
          <Field label="Odometer">
            {selectedJob.odometer != null
              ? `${selectedJob.odometer.toLocaleString()} km`
              : ""}
          </Field>
        </dl>

        {(selectedJob.serviceComments ||
          selectedJob.inspectionComments ||
          selectedJob.invoiceComments) && (
          <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5">
            {selectedJob.serviceComments && (
              <Field label="Service comments">
                <span className="whitespace-pre-wrap">
                  {selectedJob.serviceComments}
                </span>
              </Field>
            )}
            {selectedJob.inspectionComments && (
              <Field label="Inspection comments">
                <span className="whitespace-pre-wrap">
                  {selectedJob.inspectionComments}
                </span>
              </Field>
            )}
            {selectedJob.invoiceComments && (
              <Field label="Invoice comments">
                <span className="whitespace-pre-wrap">
                  {selectedJob.invoiceComments}
                </span>
              </Field>
            )}
          </dl>
        )}
      </Card>

      {/* Parts */}
      <Card title="Parts & labour" className="overflow-hidden">
        <div className="-m-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-medium">Part</th>
                <th className="px-3 py-3 text-right font-medium">Qty</th>
                <th className="px-3 py-3 text-right font-medium">Price</th>
                <th className="px-3 py-3 text-right font-medium">Line total</th>
                <th className="px-3 py-3 text-right font-medium">Hours</th>
                <th className="px-6 py-3 font-medium">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    This job has no parts.
                  </td>
                </tr>
              )}
              {parts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-900">
                    {part.Part.invoiceDisplay}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {part.quantity}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatMoney(part.sellPrice)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatMoney(part.sellPrice * part.quantity)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {part.hoursSpent}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {part.comments || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-10 w-64 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>GST (10%)</dt>
            <dd className="tabular-nums">{formatMoney(gst)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
            <dt>Total inc. GST</dt>
            <dd className="tabular-nums">{formatMoney(total)}</dd>
          </div>
        </dl>
      </Card>

      {/* Invoice */}
      <Card title="Invoice">
        <p className="mb-2 text-sm font-medium text-slate-700">
          Invoice comment
        </p>
        <CommentPicker
          selectedId={commentId}
          customText={customComment}
          onSelectedIdChange={setCommentId}
          onCustomTextChange={setCustomComment}
        />

        {alreadyInvoiced && (
          <p className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            This job has already been invoiced
            {selectedJob.invoiceId ? ` (${selectedJob.invoiceId})` : ""}.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => submitInvoice(true)}
            disabled={busy || alreadyInvoiced}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingAction === "email" && <Spinner />}
            {loadingAction === "email"
              ? "Creating & emailing…"
              : "Create & email invoice"}
          </button>
          <button
            type="button"
            onClick={() => submitInvoice(false)}
            disabled={busy || alreadyInvoiced}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingAction === "create" && <Spinner />}
            {loadingAction === "create"
              ? "Creating…"
              : "Create invoice (no email)"}
          </button>
        </div>

        {feedback && (
          <p
            role="status"
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              FEEDBACK_STYLES[feedback.kind]
            }`}
          >
            {feedback.text}
          </p>
        )}
      </Card>
    </div>
  );
};

export default JobDetails;