import { describe, expect, it } from "vitest";
import { isContinuityDevice, sortContinuityDevicesFirst } from "./continuityDevices";

describe("continuity devices", () => {
	it("recognises iPhone and iPad devices only", () => {
		expect(isContinuityDevice("Khiem's iPhone Camera")).toBe(true);
		expect(isContinuityDevice("iPhone Microphone")).toBe(true);
		expect(isContinuityDevice("iPad Pro Camera")).toBe(true);
		expect(isContinuityDevice("FaceTime HD Camera")).toBe(false);
		expect(isContinuityDevice("MacBook Pro Microphone")).toBe(false);
		expect(isContinuityDevice("Phone Booth Cam")).toBe(false);
		expect(isContinuityDevice(undefined)).toBe(false);
	});

	it("lists iPhone devices first without reordering the rest", () => {
		const sorted = sortContinuityDevicesFirst([
			{ label: "FaceTime HD Camera" },
			{ label: "Elgato" },
			{ label: "My iPhone Camera" },
		]);
		expect(sorted.map((d) => d.label)).toEqual([
			"My iPhone Camera",
			"FaceTime HD Camera",
			"Elgato",
		]);
	});
});
