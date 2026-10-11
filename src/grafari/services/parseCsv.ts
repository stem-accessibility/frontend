import Papa from "papaparse";

export type Row = Record<string, any>;

export function parseCsv(file: File): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length) {
          reject(results.errors);
        } else {
          resolve(results.data);
        }
      },
      error: (err) => reject(err),
    });
  });
}
