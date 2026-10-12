// Simple in-memory cache so we don’t refetch thumbnails while navigating within the app.
export const thumbCache = new Map<string, string | null>();

// Diagram data for STEM images that have no uploaded image (drawn as a small sketch).
export const graphCache = new Map<string, import("../../types/types").FlowchartData | null>();
