import { NextRequest, NextResponse } from 'next/server';
import { Patient, TCMHistoryRecord } from '@/types/user';

// Helper: safe string trim
const s = (v: any) => (typeof v === 'string' ? v.trim() : '');

// CSV split respecting quotes: split on commas not inside quotes
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // toggle quote state; handle escaped quotes by doubling
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Parse CSV text into array of records keyed by header
function parseCSV(text: string): Record<string, string>[] {
  // Normalize newlines and strip BOM
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n?|\n/g, '\n');
  const lines = clean.split('\n').filter(l => l.length > 0);
  if (lines.length === 0) return [];
  const header = splitCSVLine(lines[0]).map(h => s(h).replace(/^\uFEFF/, ''));
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i]);
    const rec: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      rec[header[j]] = s(parts[j] ?? '');
    }
    records.push(rec);
  }
  return records;
}

// Project constants: CSV column names observed in sample
const COL = {
  userName: '用戶名',
  content: 'Content',
  time: '時間',
  date: '日期',
  senderType: '發送者類型', // user | admin
  senderName: '發送者姓名',
  speaker: 'Speaker',
  keywords: 'Keywords',
  tcmAssist: '中醫診斷輔助',
} as const;

// Monday-start week utilities
function getStartOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun,1=Mon,...
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  const res = new Date(date);
  res.setHours(0, 0, 0, 0);
  res.setDate(res.getDate() + diff);
  return res;
}

function getEndOfWeekSunday(d: Date): Date {
  const start = getStartOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Extract array items from delimited string
function splitList(str: string): string[] {
  if (!str) return [];
  // Split on Chinese/English comma or '、' and trim; remove empty
  return str
    .split(/[，,、]/)
    .map(t => t.trim())
    .filter(Boolean);
}

interface ParsedMessage {
  date: Date; // message datetime (best effort)
  isUser: boolean; // patient speaking
  keywords: string[];
  syndromes: string[]; // from 中醫診斷輔助
  raw: Record<string, string>;
}

function buildMessages(records: Record<string, string>[]): { messages: ParsedMessage[]; ignored: number; patientNames: Set<string> } {
  const messages: ParsedMessage[] = [];
  let lastDateStr: string | undefined;
  let ignored = 0;
  const patientNames = new Set<string>();

  for (const r of records) {
    const name = s(r[COL.userName]);
    if (name) patientNames.add(name);

    let dateStr = s(r[COL.date]);
    const timeStr = s(r[COL.time]);
    if (!dateStr) {
      dateStr = lastDateStr || '';
    } else {
      lastDateStr = dateStr;
    }

    if (!dateStr || !timeStr) {
      // cannot confidently place in timeline
      ignored++;
      continue;
    }

    // Support formats like 2025/4/15 or 2025-04-15
    const normalizedDate = dateStr.replace(/\./g, '/').replace(/-/g, '/');
    const dt = new Date(`${normalizedDate} ${timeStr}`);
    if (isNaN(dt.getTime())) {
      ignored++;
      continue;
    }

    const isUser = s(r[COL.senderType]).toLowerCase() === 'user' || s(r[COL.speaker]) === name;
    const keywords = splitList(s(r[COL.keywords]));
    const syndromes = splitList(s(r[COL.tcmAssist]));

    // Only keep rows with any useful extracted data
    if (keywords.length === 0 && syndromes.length === 0) {
      continue;
    }

    messages.push({ date: dt, isUser, keywords, syndromes, raw: r });
  }

  return { messages, ignored, patientNames };
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.map(x => x.trim()).filter(Boolean)));
}

function aggregateWeekly(messages: ParsedMessage[]): { weekKey: string; start: Date; end: Date; keywords: string[]; syndromes: string[] }[] {
  const map = new Map<string, { start: Date; end: Date; keywords: string[]; syndromes: string[] }>();
  for (const m of messages) {
    const start = getStartOfWeekMonday(m.date);
    const end = getEndOfWeekSunday(m.date);
    const key = start.toISOString().slice(0, 10); // YYYY-MM-DD (Monday)
    const entry = map.get(key) || { start, end, keywords: [], syndromes: [] };
    entry.keywords.push(...m.keywords);
    entry.syndromes.push(...m.syndromes);
    map.set(key, entry);
  }
  return Array.from(map.entries()).map(([weekKey, v]) => ({ weekKey, start: v.start, end: v.end, keywords: uniq(v.keywords), syndromes: uniq(v.syndromes) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function buildHistoryRecords(weekly: { start: Date; keywords: string[]; syndromes: string[] }[]): TCMHistoryRecord[] {
  const now = new Date();
  return weekly.map(w => ({
    visitDate: w.start,
    symptoms: w.keywords,
    syndromes: w.syndromes,
    createdAt: now,
    updatedAt: now,
  }));
}

async function readCSVFromRequest(req: NextRequest): Promise<{ csvText?: string; overrides?: any }> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (file && typeof file !== 'string' && 'arrayBuffer' in file) {
      const buf = Buffer.from(await file.arrayBuffer());
      const csvText = buf.toString('utf8');
      const overridesRaw = form.get('overrides');
      let overrides: any = undefined;
      if (typeof overridesRaw === 'string') {
        try { overrides = JSON.parse(overridesRaw); } catch { /* ignore */ }
      }
      return { csvText, overrides };
    }
    const csvText = form.get('csv');
    const overridesRaw = form.get('overrides');
    let overrides: any = undefined;
    if (typeof overridesRaw === 'string') {
      try { overrides = JSON.parse(overridesRaw); } catch { /* ignore */ }
    }
    if (typeof csvText === 'string') return { csvText, overrides };
    // 允許僅提供 overrides（例如使用者完全手動編輯）
    if (overrides) return { overrides };
    throw new Error('No CSV file/csv text or overrides provided in form-data');
  }
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    const overrides = body.overrides;
    if (typeof body.csv === 'string') return { csvText: body.csv, overrides };
    if (overrides) return { overrides };
    throw new Error('JSON body must include a "csv" string property');
  }
  // fallback for text/csv or text/plain
  const text = await req.text();
  if (text && text.trim().length > 0) return { csvText: text };
  throw new Error('Unsupported content type or empty body');
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const upsert = /^(1|true|yes)$/i.test(searchParams.get('upsert') || '');
    const lineUserIdParam = searchParams.get('lineUserId') || undefined;
    const nameParam = searchParams.get('name') || undefined;

    const { csvText, overrides } = await readCSVFromRequest(req);
    let historyRecords: TCMHistoryRecord[] = [];
    let meta = { weeks: 0, messages: 0, ignored: 0 };
    let patientNames = new Set<string>();

    if (overrides && Array.isArray(overrides.historyRecords)) {
      // 採用前端使用者編輯後的結果
      const now = new Date();
      historyRecords = (overrides.historyRecords as any[]).map((r) => ({
        visitDate: new Date(r.visitDate),
        symptoms: Array.isArray(r.symptoms) ? r.symptoms : [],
        syndromes: Array.isArray(r.syndromes) ? r.syndromes : [],
        createdAt: now,
        updatedAt: now,
      }));
      meta = { weeks: historyRecords.length, messages: historyRecords.length, ignored: 0 };
    } else if (csvText) {
      const rows = parseCSV(csvText);
      const built = buildMessages(rows);
      const weekly = aggregateWeekly(built.messages);
      historyRecords = buildHistoryRecords(weekly);
      meta = { weeks: weekly.length, messages: built.messages.length, ignored: built.ignored };
      patientNames = built.patientNames;
    } else {
      throw new Error('No CSV text or overrides to process');
    }

    const now = new Date();
    // 優先用 overrides.name，其次 query string nameParam，再用 CSV 解析結果
    let patientName: string | undefined = undefined;
    if (overrides && typeof overrides.name === 'string' && overrides.name.trim()) {
      patientName = overrides.name.trim();
    } else if (nameParam) {
      patientName = nameParam;
    } else if (patientNames.size === 1) {
      patientName = Array.from(patientNames)[0];
    } else if (patientNames.size > 1) {
      patientName = Array.from(patientNames).join(',');
    }

    const patient: Patient = {
      name: patientName || 'Unknown',
      lineUserId: lineUserIdParam,
      historyRecords,
      createdAt: now,
      updatedAt: now,
    };

    let upsertResult: { upserted: boolean; patientId?: string } | undefined;
    if (upsert) {
      // Lazy import to avoid requiring MONGODB_URI during dry-run/preview
      const { getDatabase } = await import('@/lib/mongodb');
      const db = await getDatabase();
      const col = db.collection<Patient>('patients');

      // Try match by lineUserId first, then by exact name
      const filter = lineUserIdParam ? { lineUserId: lineUserIdParam } : { name: patient.name };
      const existing = await col.findOne(filter);
      if (!existing) {
        const ins = await col.insertOne(patient as any);
        upsertResult = { upserted: true, patientId: String(ins.insertedId) };
      } else {
        // Append weekly records; naive merge by visitDate uniqueness
        const existingDates = new Set((existing.historyRecords || []).map(r => new Date(r.visitDate).toISOString()));
        const toAppend = historyRecords.filter(r => !existingDates.has(new Date(r.visitDate).toISOString()));
        const upd = await col.updateOne(
          { _id: (existing as any)._id },
          {
            $push: { historyRecords: { $each: toAppend } },
            $set: { updatedAt: new Date() },
          }
        );
        upsertResult = { upserted: false, patientId: String((existing as any)._id) };
      }
    }

    return NextResponse.json({ ok: true, meta, patient, upsert: upsertResult, preview: !upsert });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';
