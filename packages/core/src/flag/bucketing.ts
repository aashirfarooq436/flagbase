/**
 * Deterministic bucketing for percentage rollouts.
 *
 * ─── READ BEFORE CHANGING ANYTHING IN THIS FILE ───────────────────────────────
 *
 * This function decides which users are inside a percentage rollout. Changing it
 * re-buckets every user of every flag simultaneously: people silently lose access
 * to features they had, and gain ones they didn't. There is no migration for that
 * and no way to debug it from the outside. Treat any edit as a breaking change.
 *
 * It is currently still safe to change — v1 ships no SDK, so nobody depends on
 * these results yet. That window closes permanently with the first v2 SDK release.
 *
 * Why this lives in `core` as pure math rather than behind an injected port:
 * bucketing must produce byte-identical results in the dashboard, in a customer's
 * Node server, and in a Cloudflare Worker, forever. An injected implementation
 * could differ between them, and the same user would flicker in and out of a
 * feature depending on which process evaluated them. Ids and clocks get injected
 * because they vary by environment; this must never vary, so it stays pure.
 */

const TOTAL_BUCKETS = 100;

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * UTF-8 bytes of a string, without TextEncoder.
 *
 * TextEncoder would work in every runtime we target, but typing it requires the
 * DOM or Node lib, which `core`'s tsconfig deliberately excludes.
 *
 * Hashing UTF-8 bytes rather than UTF-16 code units also keeps the door open for
 * the v2 non-JavaScript SDKs: every language can agree on the UTF-8 bytes of a
 * string, whereas UTF-16 code units are a JavaScript implementation detail. For
 * ASCII input the two are identical — this only matters the first time a customer
 * passes a non-ASCII subject key, at which point a Python SDK would otherwise
 * bucket that user differently than the JS one.
 */
function* utf8Bytes(input: string): Generator<number> {
  for (const char of input) {
    // Safe: iterating a string yields whole code points, so codePointAt(0) is defined.
    const cp = char.codePointAt(0) as number;

    if (cp < 0x80) {
      yield cp;
    } else if (cp < 0x800) {
      yield 0xc0 | (cp >> 6);
      yield 0x80 | (cp & 0x3f);
    } else if (cp < 0x10000) {
      yield 0xe0 | (cp >> 12);
      yield 0x80 | ((cp >> 6) & 0x3f);
      yield 0x80 | (cp & 0x3f);
    } else {
      yield 0xf0 | (cp >> 18);
      yield 0x80 | ((cp >> 12) & 0x3f);
      yield 0x80 | ((cp >> 6) & 0x3f);
      yield 0x80 | (cp & 0x3f);
    }
  }
}

/** FNV-1a, 32-bit. Chosen for being tiny, fast, dependency-free, and well-distributed. */
function fnv1a32(input: string): number {
  let hash = FNV_OFFSET_BASIS;

  for (const byte of utf8Bytes(input)) {
    hash ^= byte;
    // Math.imul keeps the multiply in 32-bit space; `*` would lose precision above 2^53.
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}

/**
 * Maps a subject to a stable bucket in [0, 100) for a given flag.
 *
 * The flag key is part of the hash input, not decoration. Hashing the subject key
 * alone would put a user in the same bucket for every flag — so someone who landed
 * in bucket 3 would be in the first 5% of every rollout on the platform, forever,
 * and a customer's "5% of users" would always be the same unlucky 5%. Salting with
 * the flag key makes each flag's bucketing independent.
 */
export function bucketOf(subjectKey: string, flagKey: string): number {
  return fnv1a32(`${flagKey}:${subjectKey}`) % TOTAL_BUCKETS;
}

export { TOTAL_BUCKETS };
