import { describe, expect, it } from "vitest";
import { createFullCamTracker } from "./fullCamTracker";

describe("createFullCamTracker", () => {
	it("records on/off toggles as ranges", () => {
		const tracker = createFullCamTracker();
		expect(tracker.toggle(1000)).toBe(true);
		expect(tracker.isActive()).toBe(true);
		expect(tracker.toggle(4000)).toBe(false);
		expect(tracker.snapshot()).toEqual([{ startMs: 1000, endMs: 4000 }]);
	});

	it("closes a still-open segment when recording stops", () => {
		const tracker = createFullCamTracker();
		tracker.toggle(2000);
		tracker.close(9000);
		expect(tracker.isActive()).toBe(false);
		expect(tracker.snapshot()).toEqual([{ startMs: 2000, endMs: 9000 }]);
	});

	it("drops accidental blips and merges near-adjacent segments", () => {
		const tracker = createFullCamTracker();
		tracker.toggle(0);
		tracker.toggle(200);
		tracker.toggle(1000);
		tracker.toggle(3000);
		tracker.toggle(3100);
		tracker.toggle(5000);
		expect(tracker.snapshot()).toEqual([{ startMs: 1000, endMs: 5000 }]);
	});

	it("starts clean after reset", () => {
		const tracker = createFullCamTracker();
		tracker.toggle(0);
		tracker.reset();
		expect(tracker.isActive()).toBe(false);
		expect(tracker.snapshot()).toEqual([]);
		tracker.close(500);
		expect(tracker.snapshot()).toEqual([]);
	});
});
