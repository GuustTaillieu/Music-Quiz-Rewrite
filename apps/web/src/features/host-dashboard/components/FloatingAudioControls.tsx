import { Timeline, useSpotifyPlayer } from "#/features/audio-player";
import { Button } from "#/features/shared/components/ui/button";
import { cn } from "#/features/shared/lib/utils";
import { Pause, Play } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

export function FloatingAudioControls({ className, ...props }: ComponentPropsWithRef<'div'>) {
    const { isPlaying, pauseTrack, resumeTrack, isReady } = useSpotifyPlayer()
    return isReady && (
        <div className={cn("fixed bottom-2 hover:w-1/2 hover:h-20 w-52 h-8 left-1/2 -translate-x-1/2 max-sm:hidden opacity-60 hover:opacity-100 bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl rounded-xl p-4 hover:pb-0 shadow-[0_0_15px_rgba(29,185,84,0.15)] shadow-cyan-500/10 transition-all duration-300 flex flex-col gap-y-2 items-center justify-center z-50 pointer-events-auto group/controls", className)} {...props}>
            <Timeline.Root className="flex flex-col w-full ">
                <Timeline.Slider />
                <div className="group-hover/controls:opacity-100 opacity-0 transition-opacity duration-300 group-hover/controls:delay-200">
                    <div className="flex justify-between group-hover/controls:h-12 h-0 group-hover/controls:mt-2 mt-0 transition-all duration-300">
                        <Timeline.LabelLeft />
                        <Button
                            variant='default'
                            size='icon'
                            className="rounded-full"
                            onClick={isPlaying ? pauseTrack : resumeTrack}>
                            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                        </Button>
                        <Timeline.LabelRight />
                    </div>
                </div>
            </Timeline.Root>
        </div>
    )
}