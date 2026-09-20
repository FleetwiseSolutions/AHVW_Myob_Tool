const STANDARD_COMMENT = `
* Semi Trailer to be serviced every 20,000KM or 3 months whichever earlier after B or C Service
* Wheel Nuts to be checked after 50KM
* Drivers/Operators must do pre-check of Heavy Vehicles before starting a trip to identify any faults.
* Service completed and Parts fitted as per manufacturer Specifications. AHVW is liable to cover costs for the Fitted/repaired parts and service completed only and is not liable for any other losses.
* All Fitted parts remain the property of AHVW unless fully paid. Parts can be recovered at any time at any place after due date.
* Replaced parts will be scrapped. Can be returned to vehicle owner upon written request before picking up the trailer. Extra charges may apply.
* Extra interest or management costs can be added to the invoices amount if not fully paid by due date.`;

export interface CommentPreset {
  id: string;
  label: string;
  text: string;
}

// TODO: replace the text of presets 2 and 3 with their real wording.
export const COMMENT_PRESETS: CommentPreset[] = [
  { id: "preset1", label: "Preset 1", text: STANDARD_COMMENT },
  { id: "preset2", label: "Preset 2", text: STANDARD_COMMENT },
  { id: "preset3", label: "Preset 3", text: STANDARD_COMMENT },
];

export const CUSTOM_COMMENT_ID = "custom";

export const DEFAULT_COMMENT = COMMENT_PRESETS[0].text;

export const resolveComment = (
  selectedId: string,
  customText: string
): string =>
  selectedId === CUSTOM_COMMENT_ID
    ? customText
    : COMMENT_PRESETS.find((p) => p.id === selectedId)?.text ?? DEFAULT_COMMENT;