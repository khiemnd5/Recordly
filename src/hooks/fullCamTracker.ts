import { type FullCamRange, normalizeFullCamRanges } from "@/components/video-editor/fullCam";

/**
 * Collects full-cam segments while recording. Times are the pause-excluded
 * recording clock, which is the same timeline as the recorded video.
 */
export function createFullCamTracker() {
	let ranges: FullCamRange[] = [];
	let openStartMs: number | null = null;

	return {
		reset() {
			ranges = [];
			openStartMs = null;
		},
		isActive() {
			return openStartMs !== null;
		},
		/** Flip the state at `nowMs`; returns whether full cam is now on. */
		toggle(nowMs: number): boolean {
			const at = Math.max(0, Math.round(nowMs));
			if (openStartMs === null) {
				openStartMs = at;
				return true;
			}
			ranges.push({ startMs: openStartMs, endMs: Math.max(at, openStartMs) });
			openStartMs = null;
			return false;
		},
		/** Close a segment that is still open (recording stopped). */
		close(nowMs: number) {
			if (openStartMs !== null) {
				this.toggle(nowMs);
			}
		},
		/** Final, merged ranges; segments too short to finish the morph are dropped. */
		snapshot(): FullCamRange[] {
			return normalizeFullCamRanges(ranges);
		},
	};
}
