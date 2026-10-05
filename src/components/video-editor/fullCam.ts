/**
 * "Full cam": time ranges (source-video ms) where the webcam is blown up from
 * its bubble to cover the whole frame, then shrinks back to the configured
 * layout. Shared by the editor preview and the exporters so both agree.
 */
export interface FullCamRange {
	startMs: number;
	endMs: number;
}

/** Duration of the bubble <-> full frame morph at each edge of a range. */
export const FULL_CAM_TRANSITION_MS = 350;
/** A range must be long enough to reach full frame and leave again. */
export const MIN_FULL_CAM_RANGE_MS = FULL_CAM_TRANSITION_MS * 2;

function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Clamp, sort and merge ranges. Ranges that touch or are closer than one
 * transition are merged (otherwise the cam would shrink and re-grow in a blink),
 * and ranges too short to complete the morph are dropped.
 */
export function normalizeFullCamRanges(
	ranges: readonly Partial<FullCamRange>[] | null | undefined,
	durationMs?: number,
): FullCamRange[] {
	if (!Array.isArray(ranges)) return [];
	const maxMs =
		Number.isFinite(durationMs) && (durationMs as number) > 0
			? (durationMs as number)
			: Infinity;
	const sorted = ranges
		.filter(
			(range): range is FullCamRange =>
				Number.isFinite(range?.startMs) && Number.isFinite(range?.endMs),
		)
		.map((range) => ({
			startMs: Math.max(0, Math.round(range.startMs)),
			endMs: Math.min(maxMs, Math.round(range.endMs)),
		}))
		.filter((range) => range.endMs > range.startMs)
		.sort((a, b) => a.startMs - b.startMs);

	const merged: FullCamRange[] = [];
	for (const range of sorted) {
		const last = merged[merged.length - 1];
		if (last && range.startMs - last.endMs < FULL_CAM_TRANSITION_MS) {
			last.endMs = Math.max(last.endMs, range.endMs);
		} else {
			merged.push({ ...range });
		}
	}
	return merged.filter((range) => range.endMs - range.startMs >= MIN_FULL_CAM_RANGE_MS);
}

/** 0 = normal webcam layout, 1 = webcam covers the full frame. */
export function getFullCamBlend(
	ranges: readonly FullCamRange[] | null | undefined,
	timeMs: number,
	transitionMs = FULL_CAM_TRANSITION_MS,
): number {
	if (!ranges || ranges.length === 0 || !Number.isFinite(timeMs)) return 0;
	let blend = 0;
	for (const { startMs, endMs } of ranges) {
		if (timeMs <= startMs || timeMs >= endMs) continue;
		const ramp = Math.min(
			1,
			(timeMs - startMs) / transitionMs,
			(endMs - timeMs) / transitionMs,
		);
		blend = Math.max(blend, easeInOutCubic(Math.max(0, ramp)));
	}
	return blend;
}

export function isFullCamActiveAt(
	ranges: readonly FullCamRange[] | null | undefined,
	timeMs: number,
): boolean {
	return getFullCamBlend(ranges, timeMs) > 0;
}

/** Add `[startMs, endMs)` to the ranges, merging with neighbours. */
export function addFullCamRange(
	ranges: readonly FullCamRange[] | undefined,
	startMs: number,
	endMs: number,
	durationMs?: number,
): FullCamRange[] {
	return normalizeFullCamRanges([...(ranges ?? []), { startMs, endMs }], durationMs);
}

/** Remove whatever range contains `timeMs`. */
export function removeFullCamRangeAt(
	ranges: readonly FullCamRange[] | undefined,
	timeMs: number,
): FullCamRange[] {
	return (ranges ?? []).filter((range) => !(timeMs >= range.startMs && timeMs <= range.endMs));
}

export function lerp(from: number, to: number, t: number): number {
	return from + (to - from) * t;
}
