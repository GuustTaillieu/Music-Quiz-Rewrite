import { Avatar, AvatarFallback, AvatarImage } from "#/features/shared/components/ui/avatar"
import { useAuth } from ".."
import { Tooltip, TooltipContent, TooltipTrigger } from "#/features/shared/components/ui/tooltip"
import { Button } from "#/features/shared/components/ui/button"
import { LogOut } from "lucide-react"

export function AuthBadge() {
    const { user, signOut } = useAuth()
    return user && (
        <div className="flex items-center gap-3 bg-black/50 border border-cyan-500/10 p-1.5 pl-3 rounded-2xl">
            <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-cyan-500/30">
                    {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                    <AvatarFallback className="text-[10px] font-black text-cyan-400 bg-cyan-500/10">
                        {user.name.slice(0, 1)}
                    </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-muted-foreground pr-1 hidden sm:inline">
                    {user.name}
                </span>
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="destructive_ghost"
                        size="icon"
                        onClick={signOut}
                        className="text-muted-foreground cursor-pointer"
                    >
                        <LogOut size={14} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Sign Out</TooltipContent>
            </Tooltip>
        </div>
    )
}