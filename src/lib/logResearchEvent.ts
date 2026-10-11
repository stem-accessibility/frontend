import { apiFetch } from "./api";

export type ResearchEventPayload = {
  flowchart_id?: string | null;
  artifact_snapshot_id?: string | null;
  event_type: string;
  editor_mode?: string | null;
  representation_type?: string | null;
  success?: boolean | null;
  error_code?: string | null;
  error_message?: string | null;
  event_data?: Record<string, unknown>;
};

export async function logResearchEvent(payload: ResearchEventPayload) {
  try {
    await apiFetch("/research-events", {
      method: "POST",
      json: payload,
    });
  } catch (err) {
    console.error("Failed to log research event:", err);
  }
}