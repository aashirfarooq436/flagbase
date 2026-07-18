import { describe, expect, it } from "vitest";

import { TOTAL_BUCKETS, bucketOf } from "./bucketing";

/** Deterministic sample subjects — no randomness, so these tests can never flake. */
function subjects(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `user-${i}`);
}

describe("bucketOf", () => {
  describe("determinism", () => {
    it("returns the same bucket for the same subject and flag, every time", () => {
      const first = bucketOf("user-42", "dark-mode");

      for (let i = 0; i < 1_000; i++) {
        expect(bucketOf("user-42", "dark-mode")).toBe(first);
      }
    });

    it("does not depend on call order or interleaving with other inputs", () => {
      const expected = bucketOf("user-42", "dark-mode");

      bucketOf("someone-else", "other-flag");
      bucketOf("user-42", "other-flag");
      bucketOf("someone-else", "dark-mode");

      expect(bucketOf("user-42", "dark-mode")).toBe(expected);
    });
  });

  describe("range", () => {
    it("always lands within [0, TOTAL_BUCKETS)", () => {
      for (const subject of subjects(10_000)) {
        const bucket = bucketOf(subject, "dark-mode");
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThan(TOTAL_BUCKETS);
      }
    });

    it("returns an integer", () => {
      for (const subject of subjects(100)) {
        expect(Number.isInteger(bucketOf(subject, "dark-mode"))).toBe(true);
      }
    });

    it("handles the empty string without escaping the range", () => {
      const bucket = bucketOf("", "");
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(TOTAL_BUCKETS);
    });
  });

  describe("independence between flags", () => {
    // The reason the flag key is part of the hash input. Without it, a subject would
    // sit in the same bucket for every flag, and every 5% rollout on the platform
    // would hit the same unlucky users.
    it("gives a subject different buckets across different flags", () => {
      const buckets = new Set(
        ["flag-a", "flag-b", "flag-c", "flag-d", "flag-e"].map((flag) =>
          bucketOf("user-42", flag),
        ),
      );

      // Collisions are possible by chance; all five landing identically is not.
      expect(buckets.size).toBeGreaterThan(1);
    });

    it("does not correlate bucket assignment across two flags", () => {
      const sample = subjects(5_000);

      const identical = sample.filter(
        (subject) =>
          bucketOf(subject, "flag-a") === bucketOf(subject, "flag-b"),
      ).length;

      // Independent assignment ⇒ ~1% agree by chance. Correlated assignment ⇒ ~100%.
      expect(identical).toBeLessThan(sample.length * 0.03);
    });
  });

  describe("distribution", () => {
    // Guards the property a percentage rollout actually depends on: that "30%" means
    // roughly 30% of real users. A poorly distributed hash would still be deterministic
    // and still pass every test above, while quietly making rollouts wrong.
    it("spreads subjects roughly evenly across all buckets", () => {
      const sample = subjects(50_000);
      const counts = new Array<number>(TOTAL_BUCKETS).fill(0);

      for (const subject of sample) {
        counts[bucketOf(subject, "dark-mode")]! += 1;
      }

      const expectedPerBucket = sample.length / TOTAL_BUCKETS; // 500
      // ~4.5σ for n=50k, p=0.01 (σ ≈ 22). Deterministic input, so this is a fixed pass/fail.
      const tolerance = expectedPerBucket * 0.2;

      for (const [bucket, count] of counts.entries()) {
        expect(
          Math.abs(count - expectedPerBucket),
          `bucket ${bucket} held ${count} subjects, expected ~${expectedPerBucket}`,
        ).toBeLessThan(tolerance);
      }
    });

    it("leaves no bucket empty", () => {
      const counts = new Set(
        subjects(50_000).map((subject) => bucketOf(subject, "dark-mode")),
      );

      expect(counts.size).toBe(TOTAL_BUCKETS);
    });
  });

  describe("input handling", () => {
    it("treats subject and flag as distinct fields rather than concatenated text", () => {
      // Without a separator, ("ab", "c") and ("b", "ac") could hash identically.
      expect(bucketOf("ab", "c")).not.toBe(bucketOf("b", "ac"));
    });

    it("hashes non-ASCII subject keys deterministically", () => {
      const first = bucketOf("ユーザー-42", "dark-mode");

      for (let i = 0; i < 100; i++) {
        expect(bucketOf("ユーザー-42", "dark-mode")).toBe(first);
      }

      expect(first).toBeGreaterThanOrEqual(0);
      expect(first).toBeLessThan(TOTAL_BUCKETS);
    });

    it("hashes emoji and astral-plane characters without escaping the range", () => {
      const bucket = bucketOf("user-🎉", "flag-🚀");

      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(TOTAL_BUCKETS);
    });

    it("distinguishes subjects that differ only in case", () => {
      expect(bucketOf("User-42", "dark-mode")).not.toBe(
        bucketOf("user-42", "dark-mode"),
      );
    });
  });

  describe("stability across releases", () => {
    // A canary. These values are not special — they are simply what the current
    // algorithm produces. If this test fails, the hash changed, and every existing
    // user of every flag has just been silently re-bucketed. That is only acceptable
    // as a deliberate, breaking decision (see the header of bucketing.ts).
    //
    // Hard-coded literals, NOT toMatchInlineSnapshot: a snapshot can be silently
    // re-baselined with `vitest -u`, which is exactly the accident this canary exists
    // to prevent. Changing these numbers must be a conscious, manual edit.
    it("produces the recorded buckets for known inputs", () => {
      expect(bucketOf("user-1", "dark-mode")).toBe(58);
      expect(bucketOf("user-2", "dark-mode")).toBe(39);
      expect(bucketOf("user-1", "new-checkout")).toBe(63);
      expect(bucketOf("", "")).toBe(53);
    });
  });
});
