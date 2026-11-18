# PrismLink Firestore Security Specification

## 1. Data Invariants
1. **No Accounts / Single-Document Resolution Only**: PrismLink has no login or user accounts. Visitors may fetch a single link record by exact `linkId` (`allow get`) to resolve redirects or inspect safety, while bulk collection enumeration (`allow list`) is strictly denied.
2. **Case-Insensitive ID Binding**: Document ID `{linkId}` MUST equal `incoming().code.lower()`, preventing duplicate case-variants (`Demo` vs `demo`) or mismatched key injection.
3. **Immutable Routing Fields**: Once created, `code`, `shortPath`, `originalUrl`, `protocol`, `protocolLabel`, and `createdAt` can NEVER be altered or deleted.
4. **Protocol Safety Enforcement**: Dangerous executable and local-file schemes (`javascript:`, `data:`, `vbscript:`, `jscript:`, `livescript:`, `mocha:`, `file:`) are rejected in Firestore rules in addition to client/server validation.
5. **Monotonic Atomic Click Counter**: `clicks` MUST initialize at `0`, `lastAccessedAt` MUST initialize as `null`, and updates may ONLY increment `clicks` by `+1` while setting `lastAccessedAt == request.time`.
6. **Temporal Integrity & Strict Schema Keys**: `createdAt == request.time` on creation, `lastAccessedAt == request.time` on click update, and `hasAll` + `hasOnly` reject any unexpected shadow fields.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. **Collection Enumeration (`list`)**: `GET /links` -> `PERMISSION_DENIED` (`allow list: if false`).
2. **Shadow / Ghost Field Injection**: `create` with `{ ..., isAdmin: true }` -> `PERMISSION_DENIED` (`keys().hasOnly(...)`).
3. **Oversized ID Poisoning**: `create` at `/links/<200-char-id>` -> `PERMISSION_DENIED` (`isValidId` max length 36 / 128).
4. **XSS Scheme Bypass**: `create` with `originalUrl: "javascript:alert(1)"` or `protocol: "javascript"` -> `PERMISSION_DENIED`.
5. **Data URI Injection**: `create` with `originalUrl: "data:text/html,<script>alert(1)</script>"` -> `PERMISSION_DENIED`.
6. **Spoofed Initial Click Count**: `create` with `clicks: 9999` -> `PERMISSION_DENIED` (`clicks == 0`).
7. **Forged Creation Timestamp**: `create` with `createdAt: "2020-01-01T00:00:00Z"` instead of server `request.time` -> `PERMISSION_DENIED`.
8. **Mismatched Document ID vs Code**: `create` doc `/links/abc123` with `code: "other99"` -> `PERMISSION_DENIED`.
9. **Reserved Route Hijack**: `create` doc `/links/privacy` or `/links/api` -> `PERMISSION_DENIED`.
10. **Destination Hijack on Update**: `update` changing `originalUrl` or `code` -> `PERMISSION_DENIED` (immutable fields + `affectedKeys().hasOnly(['clicks', 'lastAccessedAt'])`).
11. **Arbitrary Click Manipulation**: `update` setting `clicks: existing.clicks + 50` or decrementing `clicks: 0` -> `PERMISSION_DENIED` (`clicks == existing().clicks + 1`).
12. **Unauthorized Deletion**: `DELETE /links/{linkId}` -> `PERMISSION_DENIED` (`allow delete: if false`).
