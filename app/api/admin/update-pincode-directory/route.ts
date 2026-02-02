export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';

const PAGE_SIZE = 1000;

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) =>
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));

      try {
        // 🔍 TEMP ENV DEBUG (merged from code-2)
        send({
          stage: 'env',
          GOV_BASE: process.env.GOV_BASE,
          GOV_PINCODE_RESOURCE: process.env.GOV_PINCODE_RESOURCE,
          GOV_API_KEY: process.env.GOV_API_KEY ? 'SET' : 'MISSING',
        });

        send({ stage: 'start', message: 'Starting pincode update…' });

        const data: Record<string, Record<string, string[]>> = {};
        let offset = 0;
        let totalRecords = 0;

        while (true) {
          send({ stage: 'fetching', offset });

          const url =
            `${process.env.GOV_BASE}/${process.env.GOV_PINCODE_RESOURCE}` +
            `?api-key=${process.env.GOV_API_KEY}` +
            `&format=json&limit=${PAGE_SIZE}&offset=${offset}`;

          const res = await fetch(url);
          if (!res.ok) throw new Error('Failed to fetch data.gov.in');

          const json = await res.json();
          const records = json.records || [];

          if (records.length === 0) break;

          for (const r of records) {
            const state = (r.statename || 'NA').toUpperCase();
            const city = (r.district || 'NA').toUpperCase();
            const pincode = String(r.pincode || '').trim();

            if (!pincode) continue;

            data[state] ??= {};
            data[state][city] ??= [];

            if (!data[state][city].includes(pincode)) {
              data[state][city].push(pincode);
            }
          }

          totalRecords += records.length;
          offset += PAGE_SIZE;

          send({
            stage: 'processing',
            fetched: totalRecords,
          });
        }

        send({
          stage: 'fetched',
          records: totalRecords,
        });

        const dataDir = path.join(process.cwd(), 'data');
        const jsonPath = path.join(dataDir, 'india-location.json');
        const metaPath = path.join(dataDir, 'india-location.meta.json');

        // ---- DIFF PREVIEW ----
        let oldData: any = {};
        try {
          oldData = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
        } catch {}

        const diff = {
          statesAdded: Object.keys(data).filter(s => !oldData[s]).length,
          statesRemoved: Object.keys(oldData).filter(s => !data[s]).length,
        };

        send({ stage: 'diff', diff });

        // ---- WRITE JSON (MINIFIED) ----
        const jsonString = JSON.stringify(data);
        await fs.writeFile(jsonPath, jsonString, 'utf-8');

        // ---- WRITE GZIP ----
        const gzipped = zlib.gzipSync(jsonString);
        await fs.writeFile(jsonPath + '.gz', gzipped);

        // ---- METADATA ----
        const stats = {
          states: Object.keys(data).length,
          cities: Object.values(data).reduce(
            (sum, s) => sum + Object.keys(s).length,
            0
          ),
          pincodes: Object.values(data).reduce(
            (sum, s) =>
              sum + Object.values(s).reduce((c, arr) => c + arr.length, 0),
            0
          ),
          updatedAt: new Date().toISOString(),
          source: 'data.gov.in',
        };

        await fs.writeFile(metaPath, JSON.stringify(stats, null, 2), 'utf-8');

        send({ stage: 'done', stats });
        controller.close();
      } catch (err: any) {
        send({ stage: 'error', error: err.message });
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    },
  });
}
