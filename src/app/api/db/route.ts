import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Helper to get file path
function getFilePath(key: string) {
  // Sanitize key to prevent directory traversal
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(DATA_DIR, `${safeKey}.json`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  await ensureDataDir();
  const filePath = getFilePath(key);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT') {
      // Return null or default if file doesn't exist
      return NextResponse.json(null);
    }
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, data } = body;

    if (!key || data === undefined) {
      return NextResponse.json({ error: 'Key and data are required' }, { status: 400 });
    }

    await ensureDataDir();
    const filePath = getFilePath(key);

    // Write atomic: write to temp file then rename (optional but good practice)
    // For simplicity here: just write
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}