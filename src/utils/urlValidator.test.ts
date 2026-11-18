import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectUrlSafety,
  parseAndValidateUrl,
  validateCustomAlias,
} from './urlValidator';

test('validates standard HTTPS and HTTP URLs', () => {
  const res = parseAndValidateUrl('https://developer.mozilla.org/en-US/docs/Web?q=glass#top');
  assert.equal(res.valid, true);
  assert.equal(res.protocol, 'https');
  assert.equal(res.protocolLabel, 'Web (HTTPS)');
  assert.equal(res.host, 'developer.mozilla.org');
  assert.equal(res.normalizedUrl, 'https://developer.mozilla.org/en-US/docs/Web?q=glass#top');
});

test('normalizes bare domains and host:port inputs', () => {
  const bare = parseAndValidateUrl('example.com/launch');
  assert.equal(bare.valid, true);
  assert.equal(bare.normalizedUrl, 'https://example.com/launch');

  const pathSpace = parseAndValidateUrl('example.com/search?q=liquid glass');
  assert.equal(pathSpace.valid, true);
  assert.equal(pathSpace.normalizedUrl, 'https://example.com/search?q=liquid%20glass');

  const bareEmail = parseAndValidateUrl('team@prismlink.example');
  assert.equal(bareEmail.valid, true);
  assert.equal(bareEmail.protocol, 'mailto');
  assert.equal(bareEmail.normalizedUrl, 'mailto:team@prismlink.example');

  const localPort = parseAndValidateUrl('localhost:8080/health');
  assert.equal(localPort.valid, true);
  assert.equal(localPort.normalizedUrl, 'http://localhost:8080/health');
});

test('supports mailto, tel, magnet, and custom app deep links', () => {
  const mail = parseAndValidateUrl('mailto:team@prismlink.example?subject=Hello');
  assert.equal(mail.valid, true);
  assert.equal(mail.protocol, 'mailto');
  assert.equal(mail.protocolLabel, 'Email (mailto)');

  const tel = parseAndValidateUrl('tel:+14155550100');
  assert.equal(tel.valid, true);
  assert.equal(tel.protocol, 'tel');

  const magnet = parseAndValidateUrl('magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567');
  assert.equal(magnet.valid, true);
  assert.equal(magnet.protocol, 'magnet');
  assert.equal(magnet.protocolLabel, 'Magnet Link');

  const deepLink = parseAndValidateUrl('vscode://file/workspace/README.md');
  assert.equal(deepLink.valid, true);
  assert.equal(deepLink.protocol, 'vscode');
  assert.equal(deepLink.protocolLabel, 'App Deep Link (vscode)');
});

test('blocks dangerous XSS and local file schemes', () => {
  for (const dangerous of [
    'javascript:alert(1)',
    '  JAVASCRIPT:void(0)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ]) {
    const res = parseAndValidateUrl(dangerous);
    assert.equal(res.valid, false, `Expected ${dangerous} to be blocked`);
    assert.ok(res.error);
  }
});

test('blocks self-redirect loops on the same origin', () => {
  const loop = parseAndValidateUrl(
    'https://prismlink.app/s/abc123',
    'https://prismlink.app'
  );
  assert.equal(loop.valid, false);
  assert.match(loop.error ?? '', /redirect loop/i);
});

test('validates optional custom aliases and rejects reserved words', () => {
  assert.deepEqual(validateCustomAlias('   '), { valid: true, alias: null, error: null });
  assert.deepEqual(validateCustomAlias('launch-2026_v1'), {
    valid: true,
    alias: 'launch-2026_v1',
    error: null,
  });

  const tooShort = validateCustomAlias('ab');
  assert.equal(tooShort.valid, false);

  const badChars = validateCustomAlias('my alias!');
  assert.equal(badChars.valid, false);

  const reserved = validateCustomAlias('privacy');
  assert.equal(reserved.valid, false);

  const reservedAbout = validateCustomAlias('about');
  assert.equal(reservedAbout.valid, false);
});

test('inspectUrlSafety flags embedded credentials and reports safety checks', () => {
  const safeRes = inspectUrlSafety('https://example.com/guide');
  assert.equal(safeRes.valid, true);
  assert.equal(safeRes.safe, true);
  assert.equal(safeRes.checks.every((c) => c.passed), true);

  const phishRes = inspectUrlSafety('https://admin:secret@example.com/login');
  assert.equal(phishRes.valid, true);
  assert.equal(phishRes.safe, false);

  const xssRes = inspectUrlSafety('javascript:alert(document.cookie)');
  assert.equal(xssRes.valid, false);
  assert.equal(xssRes.safe, false);
});
