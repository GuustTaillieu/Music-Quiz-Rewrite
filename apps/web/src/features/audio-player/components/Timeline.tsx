import { useState, type ComponentPropsWithoutRef } from "react";
import { Slider } from "../../shared/components/ui/slider";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { formatTime } from "@/features/shared/utils/formatTime";
import { cn } from "#/features/shared/lib/utils";

function Timeline({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    const { seekTrack, currentPositionMs, durationMs } = useSpotifyPlayer()
    const [dragValue, setDragValue] = useState<number | null>(null);
    const displayPosition = dragValue !== null ? dragValue : currentPositionMs;

    return (
        <div className={cn("flex flex-col gap-2", className)} {...props}>
            <div className="w-full flex justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold w-10 text-right">
                    {formatTime(displayPosition)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground font-bold w-10">
                    {formatTime(durationMs)}
                </span>
            </div>
            <Slider
                min={0}
                max={durationMs}
                value={[displayPosition]}
                onValueChange={(val) => {
                    const num = Array.isArray(val) ? val[0] : Number(val);
                    setDragValue(num);
                }}
                onValueCommitted={(val) => {
                    const num = Array.isArray(val) ? val[0] : Number(val);
                    seekTrack(num).then(() => {
                        setTimeout(() => setDragValue(null), 1000)
                    })
                }}
                className="flex-1 cursor-pointer"
            />
        </div>
    )
}

function TimelineRoot({ children, className, ...props }: ComponentPropsWithoutRef<'div'>) {
    const { isReady } = useSpotifyPlayer()
    if (!isReady) return null
    return <div className={cn("", className)} {...props}>
        {children}
    </div>
}

function TimelineSlider({ className, ...props }: ComponentPropsWithoutRef<typeof Slider>) {
    const { seekTrack, currentPositionMs, durationMs } = useSpotifyPlayer()
    const [dragValue, setDragValue] = useState<number | null>(null);
    const displayPosition = dragValue !== null ? dragValue : currentPositionMs;

    return (
        <Slider
            min={0}
            max={durationMs}
            value={[displayPosition]}
            onValueChange={(val) => {
                const num = Array.isArray(val) ? val[0] : Number(val);
                setDragValue(num);
            }}
            onValueCommitted={(val) => {
                const num = Array.isArray(val) ? val[0] : Number(val);
                seekTrack(num).then(() => {
                    setTimeout(() => setDragValue(null), 1000)
                })
            }}
            className={cn("flex-1 cursor-pointer", className)}
            {...props}
        />
    )
}

function TimelineLabelLeft({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
    const { currentPositionMs } = useSpotifyPlayer()
    return (
        <span className={cn("text-[10px] font-mono text-cyan-400 font-bold w-10 text-right", className)} {...props}>
            {formatTime(currentPositionMs)}
        </span>
    )
}

function TimelineLabelRight({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
    const { durationMs } = useSpotifyPlayer()
    return (
        <span className={cn("text-[10px] font-mono text-muted-foreground font-bold w-10", className)} {...props}>
            {formatTime(durationMs)}
        </span>
    )
}

TimelineRoot.displayName = 'TimelineRoot'
TimelineSlider.displayName = 'TimelineSlider'
TimelineLabelLeft.displayName = 'TimelineLabelLeft'
TimelineLabelRight.displayName = 'TimelineLabelRight'

Timeline.Root = TimelineRoot;
Timeline.Slider = TimelineSlider;
Timeline.LabelLeft = TimelineLabelLeft;
Timeline.LabelRight = TimelineLabelRight;

export { Timeline }