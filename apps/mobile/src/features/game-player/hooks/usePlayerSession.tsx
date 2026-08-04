import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useState } from "react";

const STORAGE_KEY = (lobbyId: string) => `smq_session_${lobbyId}`

type PlayerSession = {
    getToken: (lobbyId: string) => Promise<string | null>
    setToken: (lobbyId: string, token: string) => Promise<void>
    clearSession: (lobbyId: string) => Promise<void>
    username: string
    setUsername: (username: string) => void
}
const PlayerSessionContext = createContext<PlayerSession | null>(null);

export const PlayerSessionProvider = ({ children }: { children: React.ReactNode }) => {
    const [username, setUsername] = useState<string>('');
    const getToken = useCallback(async (lobbyId: string) => {
        return await AsyncStorage.getItem(STORAGE_KEY(lobbyId));
    }, [])

    const setToken = useCallback(async (lobbyId: string, token: string) => {
        await AsyncStorage.setItem(STORAGE_KEY(lobbyId), token);
    }, [])

    const clearSession = useCallback(async (lobbyId: string) => {
        await AsyncStorage.removeItem(STORAGE_KEY(lobbyId));
    }, [])

    return (
        <PlayerSessionContext.Provider value={{ getToken, setToken, clearSession, username, setUsername }}>
            {children}
        </PlayerSessionContext.Provider>
    )
}

export const usePlayerSession = () => {
    const context = useContext(PlayerSessionContext);
    if (!context) {
        throw new Error('usePlayerSession must be used within a PlayerSessionProvider');
    }
    return context;
}
