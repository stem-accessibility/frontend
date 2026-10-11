import { type Row } from "./parseCsv";

export type DataType = "number" | "string" | "date" | "boolean" | "unknown";

export type Field = {
  id: string;
  name: string;
  dataType: DataType;
};

export type DatasetProfile = {
  rowCount: number;
  fields: Field[];
  missingByField: Record<string, number>;
};

function inferType(values: any[]): DataType {
  const cleaned = values.filter(
    (v) => v !== null && v !== undefined && v !== ""
  );
  if (cleaned.length === 0) return "unknown";

  if (cleaned.every((v) => typeof v === "boolean")) return "boolean";
  if (cleaned.every((v) => typeof v === "number" && Number.isFinite(v)))
    return "number";

  if (
    cleaned.every((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime());
    })
  )
    return "date";

  return "string";
}

export function profileDataset(rows: Row[]): DatasetProfile {
  const rowCount = rows.length;
  const fieldNames = Object.keys(rows[0] ?? {});
  const missingByField: Record<string, number> = {};
  const fields: Field[] = fieldNames.map((name, idx) => {
    const values = rows.map((r) => r[name]);
    missingByField[name] = values.filter(
      (v) => v === null || v === undefined || v === ""
    ).length;

    return {
      id: `field_${idx}`,
      name,
      dataType: inferType(values),
    };
  });

  return {
    rowCount,
    fields,
    missingByField,
  };
}
