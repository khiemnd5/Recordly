export const WEBCAM_WIDTH = 1280;
export const WEBCAM_HEIGHT = 720;
export const WEBCAM_FRAME_RATE = 30;

function getWebcamVideoConstraints(deviceId?: string): MediaTrackConstraints {
	return {
		...(deviceId ? { deviceId: { exact: deviceId } } : {}),
		width: { ideal: WEBCAM_WIDTH },
		height: { ideal: WEBCAM_HEIGHT },
		frameRate: { ideal: WEBCAM_FRAME_RATE, max: WEBCAM_FRAME_RATE },
	};
}

type SharedCamera = {
	deviceId: string | undefined;
	base: Promise<MediaStream>;
	refs: number;
};

let shared: SharedCamera | null = null;

export type WebcamLease = {
	stream: MediaStream;
	release: () => void;
};

/**
 * Lease a webcam stream. The live preview and the recorder run in the same
 * renderer and used to open the camera separately (320x320@24 vs 1280x720@30).
 * On Apple Silicon the second open renegotiates the shared capture device and
 * stopping either consumer stalled the other, leaving the recording with only
 * a fraction of a second of frames. Every consumer now gets cloned tracks of a
 * single getUserMedia session; the device is closed when the last lease ends.
 */
export async function acquireWebcamStream(deviceId?: string): Promise<WebcamLease> {
	if (shared && shared.deviceId !== deviceId && shared.refs === 0) {
		shared = null;
	}
	if (!shared || shared.deviceId !== deviceId) {
		const base = navigator.mediaDevices.getUserMedia({
			video: getWebcamVideoConstraints(deviceId),
			audio: false,
		});
		const entry: SharedCamera = { deviceId, base, refs: 0 };
		base.catch(() => {
			if (shared === entry) shared = null;
		});
		shared = entry;
	}

	const entry = shared;
	entry.refs += 1;
	let baseStream: MediaStream;
	try {
		baseStream = await entry.base;
	} catch (error) {
		entry.refs -= 1;
		throw error;
	}

	const stream = new MediaStream(baseStream.getVideoTracks().map((track) => track.clone()));
	let released = false;
	return {
		stream,
		release: () => {
			if (released) return;
			released = true;
			stream.getTracks().forEach((track) => track.stop());
			entry.refs -= 1;
			if (entry.refs <= 0) {
				baseStream.getTracks().forEach((track) => track.stop());
				if (shared === entry) shared = null;
			}
		},
	};
}
