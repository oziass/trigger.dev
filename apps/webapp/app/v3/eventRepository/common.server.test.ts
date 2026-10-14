import { describe, expect, it } from "vitest";
import {
  calculateDurationFromStart,
  convertDateToNanoseconds,
  getNowInNanoseconds,
} from "./common.server";

// 1700000000001 * 1e6 is not representable as a double (spacing is 256 at ~1.7e18),
// so Number multiplication before BigInt conversion rounds it to ...000999936.
const unsafeMs = 1_700_000_000_001;
const unsafeNs = 1_700_000_000_001_000_000n;

describe("eventRepository nanosecond conversions", () => {
  it("convertDateToNanoseconds keeps exact precision beyond MAX_SAFE_INTEGER", () => {
    expect(convertDateToNanoseconds(new Date(unsafeMs))).toBe(unsafeNs);
  });

  it("getNowInNanoseconds keeps exact precision beyond MAX_SAFE_INTEGER", () => {
    while (Date.now() % 4 === 0) {}

    const beforeNs = convertDateToNanoseconds(new Date());
    const nowNs = getNowInNanoseconds();
    const afterNs = convertDateToNanoseconds(new Date());

    expect(nowNs % 1_000_000n).toBe(0n);
    expect(nowNs).toBeGreaterThanOrEqual(beforeNs);
    expect(nowNs).toBeLessThanOrEqual(afterNs);
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
