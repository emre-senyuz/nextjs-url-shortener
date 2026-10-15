import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomInt } from 'node:crypto';

export type Link = { slug: string; url: string; clicks: number; createdAt: string };
const globalDb = globalThis as unknown as { shortenerDb?: Database.Database };
function db() {
  if (!globalDb.shortenerDb) {
    const directory = path.join(process.cwd(), 'data');
    mkdirSync(directory, { recursive: true });
    const connection = new Database(path.join(directory, 'links.sqlite'));
    connection.pragma('journal_mode = WAL');
    connection.pragma('busy_timeout = 5000');
    connection.exec(`CREATE TABLE IF NOT EXISTS links (
      slug TEXT PRIMARY KEY, url TEXT NOT NULL, clicks INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    ); CREATE INDEX IF NOT EXISTS links_created ON links(createdAt DESC);`);
    globalDb.shortenerDb = connection;
  }
  return globalDb.shortenerDb;
}
export function recentLinks(): Link[] {
  return db().prepare('SELECT * FROM links ORDER BY createdAt DESC, rowid DESC LIMIT 50').all() as Link[];
}
export function createLink(url: string): Link {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const insert = db().prepare('INSERT INTO links (slug, url, createdAt) VALUES (?, ?, ?) ON CONFLICT(slug) DO NOTHING');
  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = Array.from({ length: 7 }, () => alphabet[randomInt(alphabet.length)]).join('');
    const link = { slug, url, clicks: 0, createdAt: new Date().toISOString() };
    if (insert.run(slug, url, link.createdAt).changes) return link;
  }
  throw new Error('Unable to allocate a unique slug');
}
export function getLink(slug: string) { return db().prepare('SELECT * FROM links WHERE slug = ?').get(slug) as Link | undefined; }
export function countClick(slug: string) { return db().prepare('UPDATE links SET clicks = clicks + 1 WHERE slug = ?').run(slug).changes; }
export function deleteLink(slug: string) { return db().prepare('DELETE FROM links WHERE slug = ?').run(slug).changes; }
