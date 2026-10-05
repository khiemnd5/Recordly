import { describe, expect, it } from "vitest";
import {
	addFullCamRange,
	FULL_CAM_TRANSITION_MS,
	getFullCamBlend,
	MIN_FULL_CAM_RANGE_MS,
	normalizeFullCamRanges,
	removeFullCamRangeAt,
} from "./fullCam";

describe("getFullCamBlend", () => {
	const ranges = [{ startMs: 1000, endMs: 5000 }];

	it("is 0 outside and at the edges of a range", () => {
		expect(getFullCamBlend(ranges, 0)).toBe(0);
		expect(getFullCamBlend(ranges, 1000)).toBe(0);
		expect(getFullCamBlend(ranges, 5000)).toBe(0);
		expect(getFullCamBlend(ranges, 9000)).toBe(0);
	});

	it("is 1 once the transition has finished and until it starts again", () => {
		expect(getFullCamBlend(ranges, 1000 + FULL_CAM_TRANSITION_MS)).toBe(1);
		expect(getFullCamBlend(ranges, 3000)).toBe(1);
		expect(getFullCamBlend(ranges, 5000 - FULL_CAM_TRANSITION_MS)).toBe(1);
	});

	it("eases monotonically in and out", () => {
		const up = [1100, 1175, 1250, 1325].map((t) => getFullCamBlend(ranges, t));
		expect(up).toEqual([...up].sort((a, b) => a - b));
		expect(up[0]).toBeGreaterThan(0);
		expect(up[3]).toBeLessThan(1);
		expect(getFullCamBlend(ranges, 1000 + FULL_CAM_TRANSITION_MS / 2)).toBeCloseTo(0.5);
		expect(getFullCamBlend(ranges, 5000 - FULL_CAM_TRANSITION_MS / 2)).toBeCloseTo(0.5);
	});

	it("handles missing ranges and bad input", () => {
		expect(getFullCamBlend(undefined, 100)).toBe(0);
		expect(getFullCamBlend([], 100)).toBe(0);
		expect(getFullCamBlend(ranges, Number.NaN)).toBe(0);
	});
});

describe("normalizeFullCamRanges", () => {
	it("sorts, clamps and drops invalid or too-short ranges", () => {
		expect(
			normalizeFullCamRanges(
				[
					{ startMs: 4000, endMs: 6000 },
					{ startMs: -500, endMs: 1500 },
					{ startMs: 9000, endMs: 9100 },
					{ startMs: Number.NaN, endMs: 10 },
					{ startMs: 8000, endMs: 7000 },
				],
				5500,
			),
		).toEqual([
			{ startMs: 0, endMs: 1500 },
			{ startMs: 4000, endMs: 5500 },
		]);
	});

	it("merges overlapping ranges and ranges closer than one transition", () => {
		expect(
			normalizeFullCamRanges([
				{ startMs: 1000, endMs: 3000 },
				{ startMs: 2500, endMs: 4000 },
				{ startMs: 4000 + FULL_CAM_TRANSITION_MS - 1, endMs: 6000 },
				{ startMs: 8000, endMs: 9000 },
			]),
		).toEqual([
			{ startMs: 1000, endMs: 6000 },
			{ startMs: 8000, endMs: 9000 },
		]);
	});

	it("keeps ranges exactly as long as the minimum", () => {
		expect(normalizeFullCamRanges([{ startMs: 0, endMs: MIN_FULL_CAM_RANGE_MS }])).toHaveLength(
			1,
		);
		expect(normalizeFullCamRanges([{ startMs: 0, endMs: MIN_FULL_CAM_RANGE_MS - 1 }])).toEqual(
			[],
		);
	});

	it("tolerates non-arrays", () => {
		expect(normalizeFullCamRanges(undefined)).toEqual([]);
		expect(normalizeFullCamRanges("x" as never)).toEqual([]);
	});
});

describe("add/remove", () => {
	it("adds and merges", () => {
		expect(addFullCamRange([{ startMs: 0, endMs: 2000 }], 2100, 4000)).toEqual([
			{ startMs: 0, endMs: 4000 },
		]);
	});

	it("removes the range containing the time", () => {
		expect(
			removeFullCamRangeAt(
				[
					{ startMs: 0, endMs: 2000 },
					{ startMs: 5000, endMs: 7000 },
				],
				6000,
			),
		).toEqual([{ startMs: 0, endMs: 2000 }]);
	});
});
