import { useRouteContext } from "@tanstack/react-router"


export function useAuth() {
    const { user } = useRouteContext({ from: '/_authenticated' })

    return {
        user,
        isLoggedIn: !!user
    }
}