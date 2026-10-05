import { app, globalShortcut, type WebContents } from "electron";
import { FULL_CAM_ACCELERATOR } from "../src/lib/fullCamShortcut";

let owner: WebContents | null = null;
let lastFiredAt = 0;
// Ignore key auto-repeat and double taps.
const DEBOUNCE_MS = 300;

export const FULL_CAM_TOGGLE_CHANNEL = "full-cam-toggle";

/**
 * Register (or release) the global full-cam hotkey on behalf of `sender`.
 * Only held while a webcam recording is in progress so it never steals the
 * combo from other apps otherwise. Returns false when the OS refused it.
 */
export function setFullCamShortcutActive(sender: WebContents, active: boolean): boolean {
	if (!active) {
		if (owner === sender || owner === null) {
			releaseFullCamShortcut();
		}
		return true;
	}

	releaseFullCamShortcut();
	let registered = false;
	try {
		registered = globalShortcut.register(FULL_CAM_ACCELERATOR, () => {
			const now = Date.now();
			if (now - lastFiredAt < DEBOUNCE_MS) return;
			lastFiredAt = now;
			if (owner && !owner.isDestroyed()) {
				owner.send(FULL_CAM_TOGGLE_CHANNEL);
			}
		});
	} catch (error) {
		console.warn("Failed to register full cam shortcut:", error);
	}

	if (registered) {
		owner = sender;
		sender.once("destroyed", () => {
			if (owner === sender) releaseFullCamShortcut();
		});
	}
	return registered;
}

export function releaseFullCamShortcut(): void {
	owner = null;
	try {
		if (globalShortcut.isRegistered(FULL_CAM_ACCELERATOR)) {
			globalShortcut.unregister(FULL_CAM_ACCELERATOR);
		}
	} catch {
		// Shortcut APIs throw if the app is already shutting down.
	}
}

app.on("will-quit", releaseFullCamShortcut);
