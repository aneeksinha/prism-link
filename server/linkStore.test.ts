import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LinkStore } from './linkStore';

function createTempStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prismlink-test-'));
  const filePath = path.join(dir, 'links.json');
  return {
    filePath,
    store: new LinkStore(filePath),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

test('creates shortened links, persists to disk, and tracks clicks', () => {
  const { filePath, store, cleanup } = createTempStore();
  try {
    const created = store.create('https://example.com/pricing?plan=pro');
    assert.equal(created.ok, true);
    if (!created.ok) return;

    assert.equal(created.link.code.length, 6);
    assert.equal(created.link.shortPath, `/s/${created.link.code}`);
    assert.equal(created.link.clicks, 0);

    const clicked = store.recordClick(created.link.code);
    assert.equal(clicked?.clicks, 1);
    assert.ok(clicked?.lastAccessedAt);

    // Reload from disk to verify persistence
    const reloaded = new LinkStore(filePath);
    const fetched = reloaded.get(created.link.code);
    assert.equal(fetched?.originalUrl, 'https://example.com/pricing?plan=pro');
    assert.equal(fetched?.clicks, 1);
  } finally {
    cleanup();
  }
});

test('handles custom aliases and rejects duplicates case-insensitively', () => {
  const { store, cleanup } = createTempStore();
  try {
    const first = store.create('mailto:hello@example.com', 'ContactTeam');
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.link.code, 'ContactTeam');
    assert.equal(first.link.protocol, 'mailto');

    const dup = store.create('https://other.example.com', 'contactteam');
    assert.equal(dup.ok, false);
    if (!dup.ok) {
      assert.equal(dup.status, 409);
    }
  } finally {
    cleanup();
  }
});
