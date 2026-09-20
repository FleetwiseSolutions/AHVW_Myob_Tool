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

  return (
    <div className="mt-8 max-w-3xl">
      <label htmlFor="invoice-comment" className="block text-xl font-bold mb-2">
        Invoice Comment
      </label>
      <select
        id="invoice-comment"
        value={selectedId}
        onChange={(e) => onSelectedIdChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-3"
      >
        {COMMENT_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
        <option value={CUSTOM_COMMENT_ID}>Custom…</option>
      </select>

      {isCustom ? (
        <textarea
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          placeholder="Type the comment that will appear on the invoice..."
          rows={8}
          className="w-full p-2 border border-gray-300 rounded"
        />
      ) : (
        <pre className="w-full p-2 bg-gray-100 border border-gray-200 rounded text-sm whitespace-pre-wrap font-sans">
          {resolveComment(selectedId, customText).trim()}
        </pre>
      )}
    </div>
  );
};

export default CommentPicker;