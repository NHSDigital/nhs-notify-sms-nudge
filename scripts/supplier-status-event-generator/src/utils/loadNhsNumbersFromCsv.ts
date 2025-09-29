import fs from 'fs';
import { parse } from 'csv-parse/sync';

export function loadNhsNumbersFromCsv(filePath: string): string[] {
  const csvData = fs.readFileSync(filePath, 'utf-8');

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  return records
    .map((row: any) => row.nhsNumber)
    .filter((nhsNumber: string) => typeof nhsNumber === 'string' && nhsNumber.length > 0);
}
