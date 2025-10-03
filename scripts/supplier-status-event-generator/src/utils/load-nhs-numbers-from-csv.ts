import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import path from 'node:path';

const CSV_PATH = path.resolve(__dirname, '../../data/nhs_numbers.csv');

export function loadNhsNumbersFromCsv(): string[] {
  // This path doesn't contain user-supplied content.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const csvData = fs.readFileSync(CSV_PATH, 'utf8');

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  return records
    .map((row: any) => row.nhsNumber)
    .filter(
      (nhsNumber: string) =>
        typeof nhsNumber === 'string' && nhsNumber.length > 0,
    );
}
