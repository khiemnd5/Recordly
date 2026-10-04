const RECORDING_MIME_TYPE_PREFERENCES = [
	"video/webm;codecs=h264",
	"video/webm;codecs=vp9",
	"video/webm",
	"video/webm;codecs=vp8",
	"video/webm;codecs=av1",
] as const;

// Chromium's MP4 MediaRecorder ignores the timeslice and on Apple Silicon was
// observed to drop everything except the first/last fragment during a native
// screen capture (a 27s webcam take kept ~0.6s). WebM streams a chunk per
// timeslice, so VP8/VP9 (software encode, no VideoToolbox contention with the
// native screen recorder) come first and MP4 is only a last resort.
const WEBCAM_RECORDING_MIME_TYPE_PREFERENCES = [
	"video/webm;codecs=vp8",
	"video/webm;codecs=vp9",
	"video/webm",
	"video/webm;codecs=h264",
	"video/mp4;codecs=avc1.42E01E",
	"video/mp4;codecs=avc1",
	"video/mp4",
] as const;

type MimeTypeSelectorOptions = {
	isTypeSupported?: (type: string) => boolean;
	canPlayType?: (type: string) => string;
};

function selectMimeTypeFromPreferences(
	preferences: readonly string[],
	options: MimeTypeSelectorOptions = {},
): string | undefined {
	const isTypeSupported =
		options.isTypeSupported ?? ((type: string) => MediaRecorder.isTypeSupported(type));
	const canPlayType =
		options.canPlayType ??
		((type: string) => document.createElement("video").canPlayType(type));

	const supportedTypes = preferences.filter((type) => isTypeSupported(type));
	const playableType = supportedTypes.find((type) => canPlayType(type) !== "");

	return playableType ?? supportedTypes[0];
}

export function selectRecordingMimeType(options: MimeTypeSelectorOptions = {}): string | undefined {
	return selectMimeTypeFromPreferences(RECORDING_MIME_TYPE_PREFERENCES, options);
}

export function selectWebcamRecordingMimeType(
	options: MimeTypeSelectorOptions = {},
): string | undefined {
	return selectMimeTypeFromPreferences(WEBCAM_RECORDING_MIME_TYPE_PREFERENCES, options);
}

export function isWebmMimeType(mimeType: string | undefined | null): boolean {
	return /^video\/webm(?:[;\s]|$)/i.test(mimeType ?? "");
}

export function getVideoExtensionForMimeType(
	mimeType: string | undefined | null,
): ".mp4" | ".webm" {
	return /^video\/mp4(?:[;\s]|$)/i.test(mimeType ?? "") ? ".mp4" : ".webm";
}
