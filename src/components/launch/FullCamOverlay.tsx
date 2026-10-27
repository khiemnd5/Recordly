import { useEffect, useRef } from "react";
import { acquireWebcamStream } from "@/hooks/webcamCapture";
import styles from "./LaunchWindow.module.css";

/**
 * Live full-screen camera shown on the recorded display while a full cam
 * segment is being recorded, so the presenter sees what the final video will
 * show. It lives in the HUD overlay window (excluded from capture), shares the
 * recorder's single camera session, and is click-through.
 */
export function FullCamOverlay({
	enabled,
	active,
	deviceId,
}: {
	enabled: boolean;
	active: boolean;
	deviceId?: string;
}) {
	const videoRef = useRef<HTMLVideoElement | null>(null);

	useEffect(() => {
		if (!enabled) {
			return;
		}
		let cancelled = false;
		let release: (() => void) | null = null;
		void acquireWebcamStream(deviceId)
			.then((lease) => {
				if (cancelled) {
					lease.release();
					return;
				}
				release = lease.release;
				const video = videoRef.current;
				if (video) {
					video.srcObject = lease.stream;
					void video.play().catch(() => undefined);
				}
			})
			.catch((error) => console.warn("Full cam overlay could not open the camera:", error));
		return () => {
			cancelled = true;
			const video = videoRef.current;
			if (video) {
				video.pause();
				video.srcObject = null;
			}
			release?.();
		};
	}, [enabled, deviceId]);

	if (!enabled) {
		return null;
	}

	return (
		<div
			className={styles.fullCamOverlay}
			data-active={active ? "true" : "false"}
			aria-hidden="true"
		>
			<video
				ref={videoRef}
				className={styles.fullCamOverlayVideo}
				muted
				playsInline
				style={{ transform: "scaleX(-1)" }}
			/>
		</div>
	);
}
