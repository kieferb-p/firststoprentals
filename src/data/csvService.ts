import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { EquipmentItem } from '../types/equipment';

function parseCSV(csv: string): string[][] {
   const rows: string[][] = [];
   let current = '';
   let inQuotes = false;

   for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const next = csv[i + 1];

      if (char === '"') {
         if (inQuotes && next === '"') {
            current += '"';
            i++;
         } else {
            inQuotes = !inQuotes;
         }
      } else if (char === ',' && !inQuotes) {
         const last = rows.length - 1;
         if (last < 0) rows.push([]);
         rows[last].push(current.trim());
         current = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
         if (current || rows.length > 0) {
            const last = rows.length - 1;
            if (last < 0) rows.push([]);
            rows[last].push(current.trim());
         }
         current = '';
         if (char === '\r' && next === '\n') i++;
      } else {
         current += char;
      }
   }

   if (current) {
      const last = rows.length - 1;
      if (last < 0) rows.push([]);
      rows[last].push(current.trim());
   }

   return rows;
}

export async function getEquipmentData(): Promise<EquipmentItem[]> {
     const __dirname = fileURLToPath(new URL('.', import.meta.url));
  const csvPath = path.resolve(process.cwd(), '../../public/data/rentals_clean.csv');
  const csv = fs.readFileSync(csvPath, 'utf-8');

   const rows = parseCSV(csv);
   const headers = rows[0];
   const items: EquipmentItem[] = [];

   for (let i = 1; i < rows.length; i++) {
      if (rows[i].length < 7) continue;
      items.push({
         id: `${i}-${rows[i][1].replace(/\s+/g, '-').toLowerCase()}`,
         category: rows[i][0],
         name: rows[i][1],
         imageUrl: rows[i][2],
         dayPrice: rows[i][3],
         weekPrice: rows[i][4],
         monthPrice: rows[i][5],
         notes: rows[i][6] || '',
      });
   }

   return items;
}
