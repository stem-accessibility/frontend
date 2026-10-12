/** Who can see a STEM image. One setting; the backend keeps visibility and publication in sync. */
export type Sharing = "public" | "link" | "private";

export const SHARING_OPTIONS: { value: Sharing; label: string; help: string }[] = [
  {
    value: "public",
    label: "Public",
    help: "Anyone can find it in Browse and search, and anyone with the link can view it.",
  },
  {
    value: "link",
    label: "Anyone with the link",
    help: "Not listed in Browse or search. Only people you send the link to can view it.",
  },
  {
    value: "private",
    label: "Only me",
    help: "Nobody else can see it. You can change this later.",
  },
];

export const DEFAULT_SHARING: Sharing = "public";

export const IMAGE_SHARING_HELP =
  "Check if you want to share the source image alongside the accessible version (and have the right to do so).";

export function normalizeSharing(raw?: string | null): Sharing {
  return raw === "link" || raw === "private" || raw === "public" ? raw : "private";
}
