// Which workflow a chosen file belongs to on /create: a CSV is read as a table, a picture of a
// chart is read into one. Anything else is neither. The browser's MIME type for a CSV varies by
// system (text/csv, application/vnd.ms-excel, or empty), so the file name counts too.
export type ChartFileKind = "csv" | "image";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;
const CSV_TYPES = ["text/csv", "application/csv", "application/vnd.ms-excel"];

export function chartFileKind(file: { name: string; type: string }): ChartFileKind | null {
  const type = (file.type || "").toLowerCase();
  if (IMAGE_TYPES.includes(type) || IMAGE_EXTENSIONS.test(file.name)) return "image";
  if (/\.csv$/i.test(file.name) || CSV_TYPES.includes(type)) return "csv";
  return null;
}

export const CHART_FILE_ACCEPT = ".csv,text/csv,image/png,image/jpeg,image/webp";
