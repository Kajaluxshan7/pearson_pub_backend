#!/usr/bin/env node
/**
 * Migration script: S3 → VPS local storage
 *
 * What it does:
 *   1. Lists every image URL stored in the database (items, stories, events, specials, admins)
 *   2. Downloads each file from S3
 *   3. Saves it under  <UPLOAD_DIR>/<folder>/<original-filename>
 *   4. Updates the database row with the new local URL
 *
 * Usage (run on the VPS inside the backend project root):
 *   node scripts/migrate-s3-to-local.js
 *
 * Required env vars (can be in .env or exported before running):
 *   DATABASE_URL  or  DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION            (default: ca-central-1)
 *   AWS_S3_BUCKET_NAME    (default: pearson-pub-image)
 *   APP_URL               (e.g. https://api.thepearsonpub.com)
 *   UPLOAD_DIR            (optional, default: <cwd>/uploads)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── load .env if present ────────────────────────────────────────────────────
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── config ──────────────────────────────────────────────────────────────────
const APP_URL      = (process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');
const UPLOAD_DIR   = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const S3_BUCKET    = process.env.AWS_S3_BUCKET_NAME || 'pearson-pub-image';
const AWS_REGION   = process.env.AWS_REGION || 'ca-central-1';

// ─── lazy-load AWS SDK (must be installed) ───────────────────────────────────
let S3Client, GetObjectCommand;
try {
  ({ S3Client, GetObjectCommand } = require('@aws-sdk/client-s3'));
} catch {
  console.error('ERROR: @aws-sdk/client-s3 not found. Run: npm install @aws-sdk/client-s3');
  process.exit(1);
}

// ─── lazy-load pg ────────────────────────────────────────────────────────────
let Pool;
try {
  ({ Pool } = require('pg'));
} catch {
  console.error('ERROR: pg not found. Run: npm install pg');
  process.exit(1);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false };
  }
  return {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    user:     process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'pearson_db',
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

/** Detect which S3 folder an old S3 URL belongs to */
function detectFolder(s3Url) {
  if (!s3Url) return 'items';
  const lower = s3Url.toLowerCase();
  if (lower.includes('/profile/'))  return 'profile';
  if (lower.includes('/stories/'))  return 'stories';
  if (lower.includes('/events/'))   return 'events';
  if (lower.includes('/specials/')) return 'specials';
  return 'items';
}

/** Extract filename from S3 key / URL */
function extractFilename(s3Url) {
  try {
    const u = new URL(s3Url);
    return path.basename(u.pathname);
  } catch {
    return path.basename(s3Url);
  }
}

/** Extract S3 key from URL: https://bucket.s3.amazonaws.com/KEY */
function extractS3Key(s3Url) {
  try {
    const u = new URL(s3Url);
    // pathname starts with /
    return u.pathname.replace(/^\//, '');
  } catch {
    return s3Url;
  }
}

/** Return true only for URLs that live in our S3 bucket */
function isS3Url(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    // Matches both path-style and virtual-hosted-style S3 URLs
    return host.endsWith('.amazonaws.com');
  } catch {
    return false;
  }
}

/** Download an S3 object and save it locally. Returns the new local URL. */
async function migrateOne(s3Client, s3Url, stats) {
  if (!s3Url || s3Url.startsWith('data:') || s3Url.startsWith(APP_URL)) {
    // already local or base64 — skip
    return s3Url;
  }

  if (!isS3Url(s3Url)) {
    // External URL (e.g. Google profile picture) — leave untouched
    console.log(`  [SKIP]     ${s3Url}  (not an S3 URL)`);
    stats.skipped++;
    return s3Url;
  }

  const folder   = detectFolder(s3Url);
  const filename = extractFilename(s3Url);
  const key      = extractS3Key(s3Url);
  const destDir  = path.join(UPLOAD_DIR, folder);
  const destFile = path.join(destDir, filename);

  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  // If already downloaded in a previous run, reuse it
  if (fs.existsSync(destFile)) {
    console.log(`  [SKIP]     ${filename}  (already exists)`);
    stats.skipped++;
    return `${APP_URL}/uploads/${folder}/${filename}`;
  }

  try {
    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    const response = await s3Client.send(cmd);

    // response.Body is a ReadableStream
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    fs.writeFileSync(destFile, Buffer.concat(chunks));

    const newUrl = `${APP_URL}/uploads/${folder}/${filename}`;
    console.log(`  [OK]       ${key}  →  ${newUrl}`);
    stats.downloaded++;
    return newUrl;
  } catch (err) {
    console.error(`  [ERROR]    ${s3Url}: ${err.message}`);
    stats.errors++;
    return s3Url; // keep original so the app doesn't break
  }
}

// ─── per-table migration functions ───────────────────────────────────────────

async function migrateItems(pool, s3Client, stats) {
  console.log('\n=== Items ===');
  const { rows } = await pool.query('SELECT id, images FROM items WHERE images IS NOT NULL AND array_length(images, 1) > 0');
  console.log(`Found ${rows.length} items with images`);

  for (const row of rows) {
    const newImages = await Promise.all(row.images.map(url => migrateOne(s3Client, url, stats)));
    // images is a text[] column — pass as a JS array; pg serialises it correctly
    await pool.query('UPDATE items SET images = $1 WHERE id = $2', [newImages, row.id]);
  }
}

async function migrateStories(pool, s3Client, stats) {
  console.log('\n=== Stories ===');
  const { rows } = await pool.query('SELECT id, images FROM stories WHERE images IS NOT NULL AND array_length(images, 1) > 0');
  console.log(`Found ${rows.length} stories with images`);

  for (const row of rows) {
    const newImages = await Promise.all(row.images.map(url => migrateOne(s3Client, url, stats)));
    await pool.query('UPDATE stories SET images = $1 WHERE id = $2', [newImages, row.id]);
  }
}

async function migrateEvents(pool, s3Client, stats) {
  console.log('\n=== Events ===');
  const { rows } = await pool.query('SELECT id, images FROM events WHERE images IS NOT NULL AND array_length(images, 1) > 0');
  console.log(`Found ${rows.length} events with images`);

  for (const row of rows) {
    const newImages = await Promise.all(row.images.map(url => migrateOne(s3Client, url, stats)));
    await pool.query('UPDATE events SET images = $1 WHERE id = $2', [newImages, row.id]);
  }
}

async function migrateSpecials(pool, s3Client, stats) {
  console.log('\n=== Specials ===');
  const { rows } = await pool.query('SELECT id, image_url, image_urls FROM specials');
  console.log(`Found ${rows.length} specials`);

  for (const row of rows) {
    let newImageUrl = row.image_url;
    let newImageUrls = row.image_urls;

    if (row.image_url) {
      newImageUrl = await migrateOne(s3Client, row.image_url, stats);
    }

    if (Array.isArray(row.image_urls) && row.image_urls.length > 0) {
      newImageUrls = await Promise.all(row.image_urls.map(url => migrateOne(s3Client, url, stats)));
    }

    // image_urls is a json column — pg requires a JSON string, not a raw JS array
    await pool.query(
      'UPDATE specials SET image_url = $1, image_urls = $2 WHERE id = $3',
      [newImageUrl, newImageUrls != null ? JSON.stringify(newImageUrls) : null, row.id],
    );
  }
}

async function migrateAdminAvatars(pool, s3Client, stats) {
  console.log('\n=== Admin Avatars ===');
  const { rows } = await pool.query('SELECT id, avatar_url FROM admins WHERE avatar_url IS NOT NULL');
  console.log(`Found ${rows.length} admins with avatars`);

  for (const row of rows) {
    const newUrl = await migrateOne(s3Client, row.avatar_url, stats);
    await pool.query('UPDATE admins SET avatar_url = $1 WHERE id = $2', [newUrl, row.id]);
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== S3 → Local Storage Migration ===');
  console.log(`APP_URL:    ${APP_URL}`);
  console.log(`UPLOAD_DIR: ${UPLOAD_DIR}`);
  console.log(`S3_BUCKET:  ${S3_BUCKET}`);
  console.log(`AWS_REGION: ${AWS_REGION}`);

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('\nERROR: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const pool = new Pool(getDbConfig());
  await pool.query('SELECT 1'); // verify connection
  console.log('\nDatabase connection OK');

  const stats = { downloaded: 0, skipped: 0, errors: 0 };

  await migrateItems(pool, s3Client, stats);
  await migrateStories(pool, s3Client, stats);
  await migrateEvents(pool, s3Client, stats);
  await migrateSpecials(pool, s3Client, stats);
  await migrateAdminAvatars(pool, s3Client, stats);

  await pool.end();

  console.log('\n=== Migration complete ===');
  console.log(`  Downloaded : ${stats.downloaded}`);
  console.log(`  Skipped    : ${stats.skipped}`);
  console.log(`  Errors     : ${stats.errors}`);

  if (stats.errors > 0) {
    console.log('\nSome files failed. The original S3 URL was kept for those rows.');
    console.log('Fix the errors and re-run — already-downloaded files will be skipped.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
