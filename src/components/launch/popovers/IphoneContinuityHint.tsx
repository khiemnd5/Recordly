import { ArrowClockwiseIcon, SmartphoneIcon } from "@/components/ui/icons";
import { useScopedT } from "@/contexts/I18nContext";

/**
 * Shown on macOS when no nearby iPhone is listed. Pairing is handled by
 * Continuity Camera; this explains the requirements and rescans on demand.
 */
export function IphoneContinuityHint({
	kind,
	onRefresh,
}: {
	kind: "camera" | "microphone";
	onRefresh: () => void;
}) {
	const t = useScopedT("launch");
	return (
		<div className="mx-2 my-1 flex flex-col gap-1.5 rounded-xl bg-[var(--launch-hover)] px-3 py-2">
			<div className="flex items-center gap-2 text-xs font-medium text-[var(--launch-text)]">
				<SmartphoneIcon size={14} />
				{kind === "camera"
					? t("recording.iphoneCameraTitle")
					: t("recording.iphoneMicTitle")}
			</div>
			<p className="text-[11px] leading-snug text-[var(--launch-text-muted)]">
				{t("recording.iphoneHint")}
			</p>
			<button
				type="button"
				onClick={onRefresh}
				className="flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium text-accent hover:bg-[var(--launch-hover)]"
			>
				<ArrowClockwiseIcon size={12} />
				{t("recording.iphoneRefresh")}
			</button>
		</div>
	);
}
