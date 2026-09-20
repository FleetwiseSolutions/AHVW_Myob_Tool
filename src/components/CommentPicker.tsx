"use client";

import React from "react";
import {
  COMMENT_PRESETS,
  CUSTOM_COMMENT_ID,
  resolveComment,
} from "@/lib/commentPresets";

interface CommentPickerProps {
  selectedId: string;
  customText: string;
  onSelectedIdChange: (id: string) => void;
  onCustomTextChange: (text: string) => void;
}

const CommentPicker: React.FC<CommentPickerProps> = ({
  selectedId,
  customText,
  onSelectedIdChange,
  onCustomTextChange,
}) => {
  const isCustom = selectedId === CUSTOM_COMMENT_ID;
  const options = [
    ...COMMENT_PRESETS.map((p) => ({ id: p.id, label: p.label })),
    { id: CUSTOM_COMMENT_ID, label: "Custom" },
  ];

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Invoice comment"
        className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1"
      >
        {options.map((opt) => {
          const active = opt.id === selectedId;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelectedIdChange(opt.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        {isCustom ? (
          <>
            <textarea
              value={customText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              placeholder="Type the comment that will appear on the invoice…"
              rows={8}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {customText.trim() === "" && (
              <p className="mt-1 text-xs text-amber-600">
                Blank — the invoice will be created with no comment.
              </p>
            )}
          </>
        ) : (
          <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-sans text-[13px] leading-relaxed text-slate-600">
            {resolveComment(selectedId, customText).trim()}
          </pre>
        )}
      </div>
    </div>
  );
};

export default CommentPicker;