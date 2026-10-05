/** Global hotkeys that are only held while a recording is in progress. */
export const FULL_CAM_ACCELERATOR = "CommandOrControl+Shift+F";
export const HUD_BAR_ACCELERATOR = "CommandOrControl+Shift+H";

export function formatFullCamShortcut(platform: string = "darwin"): string {
	return platform === "darwin" ? "⌘⇧F" : "Ctrl+Shift+F";
}

export function formatHudBarShortcut(platform: string = "darwin"): string {
	return platform === "darwin" ? "⌘⇧H" : "Ctrl+Shift+H";
}
