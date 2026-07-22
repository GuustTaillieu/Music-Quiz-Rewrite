import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '#/features/shared/api/client';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface SpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      name: string;
      artists: { name: string }[];
    };
  };
}

export function useSpotifyPlayer(enabled: boolean) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);

  // Smooth position tracking variables
  const [currentPlaybackMs, setCurrentPlaybackMs] = useState(0);
  const stateTimestampRef = useRef<number>(Date.now());

  // Use refs to avoid stale closures in listeners
  const fetchTokenRef = useRef<() => Promise<string>>(null);

  const fetchToken = async (): Promise<string> => {
    const { data, error } = await apiFetch<{ accessToken: string }>('/spotify/token');
    if (error) {
      throw new Error('Failed to retrieve Spotify access token.');
    }
    return data.accessToken;
  };

  fetchTokenRef.current = fetchToken;

  // Track position updates continuously when song is playing
  useEffect(() => {
    if (!playbackState || playbackState.paused) {
      setCurrentPlaybackMs(playbackState ? playbackState.position : 0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - stateTimestampRef.current;
      setCurrentPlaybackMs(playbackState.position + elapsed);
    }, 200);

    return () => clearInterval(interval);
  }, [playbackState]);

  useEffect(() => {
    if (!enabled) return;

    const initializeSDK = () => {
      window.onSpotifyWebPlaybackSDKReady = async () => {
        try {
          if (fetchTokenRef.current) await fetchTokenRef.current();

          const newPlayer = new window.Spotify.Player({
            name: 'Spotify Music Quiz Board',
            getOAuthToken: (cb: (t: string) => void) => {
              if (fetchTokenRef.current) {
                fetchTokenRef.current()
                  .then(cb)
                  .catch((e) => console.error('Failed to get token during refresh', e));
              }
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
            setPlaybackState(state);
            stateTimestampRef.current = Date.now();
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
        window.onSpotifyWebPlaybackSDKReady();
      }
    };

    initializeSDK();

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [enabled]);

  const playTrack = async (trackId: string, offsetMs = 0, retries = 2): Promise<void> => {
    if (!deviceId) return;
    try {
      const { error } = await apiFetch('/spotify/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          trackId,
          offsetMs,
        }),
      });

      if (error) {
        console.warn(`Spotify play request returned error: ${error}. Retries left: ${retries}`);
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 800));
          return playTrack(trackId, offsetMs, retries - 1);
        }
      }
    } catch (e) {
      console.error('Failed to control play command:', e);
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return playTrack(trackId, offsetMs, retries - 1);
      }
    }
  };

  const pauseTrack = async (retries = 2): Promise<void> => {
    if (!player) return;
    try {
      await player.pause();
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return pauseTrack(retries - 1);
      } else {
        console.warn('Native SDK pause failed:', e);
      }
    }
  };

  const seekTrack = async (positionMs: number, retries = 2): Promise<void> => {
    if (!player) return;
    try {
      await player.seek(positionMs);
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return seekTrack(positionMs, retries - 1);
      } else {
        console.warn('Native SDK seek failed:', e);
      }
    }
  };

  const resumeTrack = async (retries = 2): Promise<void> => {
    if (!player) return;
    try {
      await player.resume();
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return resumeTrack(retries - 1);
      } else {
        console.warn('Native SDK resume failed:', e);
      }
    }
  };

  const togglePlay = async (retries = 2): Promise<void> => {
    if (!player) return;
    try {
      await player.togglePlay();
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return togglePlay(retries - 1);
      } else {
        console.warn('Native SDK togglePlay failed:', e);
      }
    }
  };

  const lastVolumeRef = useRef<number | null>(null);

  const setVolume = async (volumeFraction: number) => {
    if (!player || !deviceId) return;
    if (lastVolumeRef.current === volumeFraction) return;
    lastVolumeRef.current = volumeFraction;
    try {
      await player.setVolume(volumeFraction);
    } catch (e) {
      console.warn('Failed to set player volume:', e);
    }
  };

  return {
    deviceId,
    isPlaying: playbackState ? !playbackState.paused : false,
    currentPositionMs: currentPlaybackMs,
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
