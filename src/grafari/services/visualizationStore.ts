import type { VisualizationRecord } from "../types/visualizationRecord";

const KEY = "grafari:visualizations:v1";

type StoreShape = {
  byId: Record<string, VisualizationRecord>;
};

function readStore(): StoreShape {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { byId: {} };
  try {
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed?.byId) return { byId: {} };
    return parsed;
  } catch {
    return { byId: {} };
  }
}

function writeStore(value: StoreShape) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function saveVisualizationRecord(record: VisualizationRecord) {
  const store = readStore();
  store.byId[record.id] = record;
  writeStore(store);
  return record;
}

export function getVisualizationRecord(id: string): VisualizationRecord | null {
  const store = readStore();
  return store.byId[id] ?? null;
}

export function updateVisualizationRecord(
  id: string,
  patch: Partial<VisualizationRecord>
): VisualizationRecord | null {
  const store = readStore();
  const existing = store.byId[id];
  if (!existing) return null;

  const updated: VisualizationRecord = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  store.byId[id] = updated;
  writeStore(store);
  return updated;
}

export function deleteVisualizationRecord(id: string) {
  const store = readStore();
  delete store.byId[id];
  writeStore(store);
}
