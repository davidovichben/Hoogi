import 'dotenv/config';
import fs from 'fs-extra';
import { createClient } from '@supabase/supabase-js';
import { Parser as Json2CsvParser } from 'json2csv';

const ENV_FILE = '.env.local';
(async () => {
  const started = Date.now();
  try {
    if (!fs.existsSync(ENV_FILE)) {
      console.warn(`[warn] ${ENV_FILE} not found. Will rely on process env if set.`);
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const SUPABASE_TABLES_ENV = (process.env.SUPABASE_TABLES || '').trim();

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[error] Missing SUPABASE_URL or SUPABASE_ANON_KEY in env.');
      process.exit(1);
    }

    // resolve tables list
    let tables = [];
    if (SUPABASE_TABLES_ENV) {
      tables = SUPABASE_TABLES_ENV.split(',').map(s => s.trim()).filter(Boolean);
      console.log('[info] Using tables from SUPABASE_TABLES:', tables);
    } else if (fs.existsSync('scripts/tables.json')) {
      try {
        const arr = JSON.parse(await fs.readFile('scripts/tables.json', 'utf-8'));
        if (Array.isArray(arr) && arr.length) {
          tables = arr.map(s => String(s).trim()).filter(Boolean);
          console.log('[info] Using tables from scripts/tables.json:', tables);
        }
      } catch (e) {
        console.warn('[warn] Failed to parse scripts/tables.json, will use defaults.');
      }
    }
    if (!tables.length) {
      tables = ['leads','questionnaires','responses']; // default fallback
      console.log('[info] Using default tables:', tables);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });

    await fs.ensureDir('exports');

    const allData = {};
    const summary = [];

    async function fetchAll(table) {
      const pageSize = 1000;
      let from = 0;
      let to = from + pageSize - 1;
      let rows = [];
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .range(from, to);

        if (error) {
          throw new Error(`Fetch error for ${table}: ${error.message}`);
        }
        if (!data || data.length === 0) break;

        rows = rows.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
        to += pageSize;
      }
      return rows;
    }

    function writeJson(file, obj) {
      return fs.writeFile(file, JSON.stringify(obj, null, 2), 'utf-8');
    }

    function writeCsv(file, rows) {
      if (!rows || rows.length === 0) {
        // write empty CSV with no data; best effort header
        return fs.writeFile(file, '', 'utf-8');
      }
      const fields = Array.from(
        rows.reduce((set, r) => {
          Object.keys(r).forEach(k => set.add(k));
          return set;
        }, new Set(Object.keys(rows[0]) ))
      );
      const parser = new Json2CsvParser({ fields });
      const csv = parser.parse(rows);
      return fs.writeFile(file, csv, 'utf-8');
    }

    function appendNdjson(stream, table, rows) {
      for (const r of rows) {
        stream.write(JSON.stringify({ table, row: r }) + '\n');
      }
    }

    const ndjsonPath = 'exports/all_data.ndjson';
    const ndjsonStream = fs.createWriteStream(ndjsonPath, { encoding: 'utf-8' });

    for (const table of tables) {
      const t0 = Date.now();
      try {
        const rows = await fetchAll(table);
        allData[table] = rows;

        const jsonPath = `exports/${table}.json`;
        const csvPath  = `exports/${table}.csv`;

        await writeJson(jsonPath, rows);
        await writeCsv(csvPath, rows);
        appendNdjson(ndjsonStream, table, rows);

        summary.push({
          table,
          rows: rows.length,
          json: jsonPath,
          csv: csvPath,
          ms: Date.now() - t0
        });
        console.log(`[ok] ${table}: ${rows.length} rows -> ${jsonPath}, ${csvPath}`);
      } catch (e) {
        summary.push({ table, error: String(e.message) });
        console.error(`[fail] ${table}: ${e.message}`);
        continue;
      }
    }

    ndjsonStream.end();

    await writeJson('exports/all_data.json', allData);

    const took = Date.now() - started;
    console.log('\n=== Export Summary ===');
    summary.forEach(s => {
      if (s.error) {
        console.log(`- ${s.table}: FAILED (${s.error})`);
      } else {
        console.log(`- ${s.table}: ${s.rows} rows [${s.ms} ms]`);
        console.log(`   JSON: ${s.json}`);
        console.log(`   CSV : ${s.csv}`);
      }
    });
    console.log(`Total time: ${took} ms`);

    const succeeded = summary.some(s => !s.error);
    if (!succeeded) process.exitCode = 1;

    console.log('\nUsage:');
    console.log('- Copy .env.local.example to .env.local and fill keys.');
    console.log('- Option A: edit scripts/tables.json');
    console.log('- Option B: run with SUPABASE_TABLES env');
    console.log('- Run: npm run export:data');
    console.log('- Output appears under exports/');
  } catch (e) {
    console.error('[fatal]', e);
    process.exit(1);
  }
})();


