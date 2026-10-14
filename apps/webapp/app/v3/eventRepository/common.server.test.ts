import { describe, expect, it } from "vitest";
import {
  calculateDurationFromStart,
  convertDateToNanoseconds,
  getNowInNanoseconds,
} from "./common.server";

// 1700000000001 * 1e6 is not representable as a double (the spacing is 256 at ~1.7e18),
// so multiplying as a Number before converting to BigInt rounds it to ...000999936.
const unsafeMs = 1_700_000_000_001;
const unsafeNs = 1_700_000_000_001_000_000n;

describe("eventRepository nanosecond conversions", () => {
  it("convertDateToNanoseconds keeps exact precision beyond MAX_SAFE_INTEGER", () => {
    expect(convertDateToNanoseconds(new Date(unsafeMs))).toBe(unsafeNs);
  });

  it("getNowInNanoseconds is always a whole number of milliseconds", () => {
    // The product ms * 1e6 is a multiple of 256 only when ms is divisible by 4, so a few
    // milliseconds of real-clock samples always include values the lossy path would round.
    const before = convertDateToNanoseconds(new Date());
    const samples: bigint[] = [];
    const deadline = Date.now() + 12;
    while (Date.now() < deadline) {
      samples.push(getNowInNanoseconds());
    }
    const after = convertDateToNanoseconds(new Date());

    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample % 1_000_000n).toBe(0n);
      expect(sample >= before && sample <= after).toBe(true);
    }
  });

  it("calculateDurationFromStart is exact for sub-millisecond-sensitive end times", () => {
    const startTime = convertDateToNanoseconds(new Date(unsafeMs - 1));

    expect(calculateDurationFromStart(startTime, new Date(unsafeMs))).toBe(1_000_000);
  });

  it("calculateDurationFromStart applies the minimum duration", () => {
    const startTime = convertDateToNanoseconds(new Date(unsafeMs - 1));

    expect(calculateDurationFromStart(startTime, new Date(unsafeMs), 5_000_000)).toBe(5_000_000);
  });
});
