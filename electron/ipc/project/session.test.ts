import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({ app: { getPath: () => os.tmpdir() } }));

const { persistRecordingSessionManifest, resolveRecordingSessionManifest, sanitizeFullCamRanges } =
	await import("./session");

describe("recording session full cam ranges", () => {
	let root: string;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), "recordly-session-"));
	});

	afterEach(async () => {
		await fs.rm(root, { recursive: true, force: true });
	});

	it("round-trips full cam ranges through the manifest", async () => {
		const videoPath = path.join(root, "recording-1.mp4");
		const webcamPath = path.join(root, "recording-1-webcam.webm");
		await fs.writeFile(videoPath, "v");
		await fs.writeFile(webcamPath, "w");

		await persistRecordingSessionManifest({
			videoPath,
			webcamPath,
			timeOffsetMs: 12,
			fullCamRanges: [
				{ startMs: 5000, endMs: 9000 },
				{ startMs: 1000, endMs: 3000.4 },
			],
		});

		const session = await resolveRecordingSessionManifest(videoPath);
		expect(session?.webcamPath).toBe(webcamPath);
		expect(session?.timeOffsetMs).toBe(12);
		expect(session?.fullCamRanges).toEqual([
			{ startMs: 1000, endMs: 3000 },
			{ startMs: 5000, endMs: 9000 },
		]);
	});

	it("omits the field when nothing was recorded", async () => {
		const videoPath = path.join(root, "recording-2.mp4");
		const webcamPath = path.join(root, "recording-2-webcam.webm");
		await fs.writeFile(videoPath, "v");
		await fs.writeFile(webcamPath, "w");

		await persistRecordingSessionManifest({ videoPath, webcamPath });
		const session = await resolveRecordingSessionManifest(videoPath);
		expect(session?.fullCamRanges).toBeUndefined();
	});

	it("sanitizes junk coming over IPC", () => {
		expect(sanitizeFullCamRanges("nope")).toBeUndefined();
		expect(
			sanitizeFullCamRanges([
				{ startMs: -1, endMs: 10 },
				{ startMs: 10, endMs: 5 },
				{ startMs: "a", endMs: 9 },
				null,
				{ startMs: 200, endMs: 900 },
			]),
		).toEqual([{ startMs: 200, endMs: 900 }]);
	});
});
