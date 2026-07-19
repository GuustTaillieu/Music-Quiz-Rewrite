import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '#/lib/api';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Spotify?: any;
  }
}

interface SpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
    };
  };
}

export function useSpotifyPlayer(enabled: boolean) {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polls the state positions when active to update scrubbers smoothly
  useEffect(() => {
    if (playbackState && !playbackState.paused) {
      intervalRef.current = setInterval(() => {
        setPlaybackState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            position: Math.min(prev.position + 1000, prev.duration),
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playbackState]);

  useEffect(() => {
    if (!enabled) return;

    // Fetch refreshed token from backend secure endpoint
    const fetchToken = async (): Promise<string> => {
      const { data, error } = await apiFetch<{ accessToken: string }>('/spotify/token');
      if (error) {
        throw new Error('Failed to retrieve Spotify access token.');
      }
      return data.accessToken;
    };

    const initializeSDK = () => {
      window.onSpotifyWebPlaybackSDKReady = async () => {
        try {
          await fetchToken();

          const newPlayer = new window.Spotify.Player({
            name: 'Spotify Music Quiz Board',
            getOAuthToken: (cb: (t: string) => void) => {
              fetchToken().then(cb).catch((e) => console.error('Failed to get token during refresh', e));
            },
            volume: 0.5,
          });

          newPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
            setDeviceId(device_id);
            setPlayer(newPlayer);
            setErrorMsg(null);
            console.log('Spotify Player ready with Device ID:', device_id);
          });

          newPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
            setDeviceId(null);
            console.log('Spotify Device ID went offline:', device_id);
          });

          newPlayer.addListener('player_state_changed', (state: SpotifyPlaybackState) => {
            if (!state) return;
            setPlaybackState(state);
          });

          newPlayer.addListener('account_error', () => {
            setIsPremium(false);
            setErrorMsg('Spotify Premium account is required to play songs directly in the browser.');
          });

          newPlayer.addListener('initialization_error', (e: { message: string }) => {
            setErrorMsg(e.message);
          });

          newPlayer.addListener('authentication_error', (e: { message: string }) => {
            setErrorMsg(e.message);
          });

          newPlayer.connect();
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
        }
      };

      if (!window.Spotify) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      } else {
        if (window.onSpotifyWebPlaybackSDKReady) {
          window.onSpotifyWebPlaybackSDKReady();
        }
      }
    };

    initializeSDK();

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [enabled]);

  const playTrack = async (trackId: string, offsetMs = 0) => {
    if (!deviceId) return;
    try {
      const { data: tokenData } = await apiFetch<{ accessToken: string }>('/spotify/token');
      if (!tokenData) return;

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`],
          position_ms: offsetMs,
        }),
      });
    } catch (e) {
      console.error('Failed to control play command:', e);
    }
  };

  const pauseTrack = async () => {
    if (!deviceId) return;
    try {
      const { data: tokenData } = await apiFetch<{ accessToken: string }>('/spotify/token');
      if (!tokenData) return;

      await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
      });
    } catch (e) {
      console.error('Failed to control pause command:', e);
    }
  };

  const seekTrack = async (positionMs: number) => {
    if (!deviceId) return;
    try {
      const { data: tokenData } = await apiFetch<{ accessToken: string }>('/spotify/token');
      if (!tokenData) return;

      await fetch(`https://api.spotify.com/v1/me/player/seek?device_id=${deviceId}&position_ms=${positionMs}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
      });
    } catch (e) {
      console.error('Failed to seek track command:', e);
    }
  };

  const resumeTrack = async () => {
    if (!deviceId) return;
    try {
      const { data: tokenData } = await apiFetch<{ accessToken: string }>('/spotify/token');
      if (!tokenData) return;

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
      });
    } catch (e) {
      console.error('Failed to resume track command:', e);
    }
  };

  const setVolume = async (volumeFraction: number) => {
    if (!player) return;
    try {
      await player.setVolume(volumeFraction);
    } catch (e) {
      console.error('Failed to set player volume:', e);
    }
  };

  return {
    deviceId,
    isPlaying: playbackState ? !playbackState.paused : false,
    currentPositionMs: playbackState ? playbackState.position : 0,
    durationMs: playbackState ? playbackState.duration : 0,
    isPremium,
    errorMsg,
    playTrack,
    pauseTrack,
    seekTrack,
    resumeTrack,
    setVolume,
  };
}
