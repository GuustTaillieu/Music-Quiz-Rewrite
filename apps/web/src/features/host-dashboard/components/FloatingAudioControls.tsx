import { Timeline, useSpotifyPlayer } from "#/features/audio-player";
import { cn } from "#/features/shared/lib/utils";
import { Button } from "@base-ui/react";
import { Pause, Play } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

export function FloatingAudioControls({ className, ...props }: ComponentPropsWithRef<'div'>) {
    const { isPlaying, pauseTrack, resumeTrack, isReady } = useSpotifyPlayer()
    return isReady && (
        <div className={cn("absolute bottom-6 left-6 flex items-center justify-center z-50 pointer-events-auto", className)} {...props}>
            <Timeline />
            <div className="flex gap-2">
                <Button onClick={isPlaying ? pauseTrack : resumeTrack}>
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </Button>
            </div>
        </div>
    )
}