/**
 * macOS Continuity Camera exposes a nearby iPhone/iPad as a normal camera and
 * microphone (labels such as "Khiem's iPhone Camera" / "iPhone Microphone").
 * The OS does the pairing; we just make those devices easy to spot and pick.
 */
export function isContinuityDevice(label: string | undefined | null): boolean {
	return /\b(iphone|ipad)\b/i.test(label ?? "");
}

export function sortContinuityDevicesFirst<T extends { label: string }>(
	devices: readonly T[],
): T[] {
	return [...devices].sort(
		(a, b) => Number(isContinuityDevice(b.label)) - Number(isContinuityDevice(a.label)),
	);
}
