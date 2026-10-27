import { app, globalShortcut, type WebContents } from "electron";
import { FULL_CAM_ACCELERATOR, HUD_BAR_ACCELERATOR } from "../src/lib/recordingShortcuts";

export const FULL_CAM_TOGGLE_CHANNEL = "full-cam-toggle";
export const HUD_BAR_TOGGLE_CHANNEL = "hud-bar-toggle";

// Ignore key auto-repeat and double taps.
const DEBOUNCE_MS = 300;

const SHORTCUTS = [
	{ key: "fullCam", accelerator: FULL_CAM_ACCELERATOR, channel: FULL_CAM_TOGGLE_CHANNEL },
	{ key: "hudBar", accelerator: HUD_BAR_ACCELERATOR, channel: HUD_BAR_TOGGLE_CHANNEL },
] as const;

export type RecordingShortcutResult = Record<(typeof SHORTCUTS)[number]["key"], boolean>;

let owner: WebContents | null = null;
const lastFiredAt = new Map<string, number>();

/**
 * Register (or release) the recording hotkeys on behalf of `sender`. They are
 * only held while a recording is running so the combos are never stolen from
 * other apps otherwise. Each result is false when the OS refused the combo.
 */
export function setRecordingShortcutsActive(
	sender: WebContents,
	active: boolean,
): RecordingShortcutResult {
	if (!active) {
		if (owner === sender || owner === null) {
			releaseRecordingShortcuts();
		}
		return { fullCam: true, hudBar: true };
	}

	releaseRecordingShortcuts();
	const result: RecordingShortcutResult = { fullCam: false, hudBar: false };
	for (const { key, accelerator, channel } of SHORTCUTS) {
		try {
			result[key] = globalShortcut.register(accelerator, () => {
				const now = Date.now();
				if (now - (lastFiredAt.get(channel) ?? 0) < DEBOUNCE_MS) return;
				lastFiredAt.set(channel, now);
				if (owner && !owner.isDestroyed()) {
					owner.send(channel);
				}
			});
		} catch (error) {
			console.warn(`Failed to register ${accelerator}:`, error);
		}
	}

	if (result.fullCam || result.hudBar) {
		owner = sender;
		sender.once("destroyed", () => {
			if (owner === sender) releaseRecordingShortcuts();
		});
	}
	return result;
}

export function releaseRecordingShortcuts(): void {
	owner = null;
	for (const { accelerator } of SHORTCUTS) {
		try {
			if (globalShortcut.isRegistered(accelerator)) {
				globalShortcut.unregister(accelerator);
			}
		} catch {
			// Shortcut APIs throw if the app is already shutting down.
		}
	}
}

app.on("will-quit", releaseRecordingShortcuts);
