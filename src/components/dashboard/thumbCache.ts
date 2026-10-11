// Simple in-memory cache so we don’t refetch thumbnails while navigating within the app.
export const thumbCache = new Map<string, string | null>();
