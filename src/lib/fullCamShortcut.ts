/** Global hotkey (while recording) that toggles the webcam between bubble and full frame. */
export const FULL_CAM_ACCELERATOR = "CommandOrControl+Shift+F";

export function formatFullCamShortcut(platform: string = "darwin"): string {
	return platform === "darwin" ? "⌘⇧F" : "Ctrl+Shift+F";
}
