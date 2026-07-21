import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '#/lib/api';

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

  // Use refs to avoid stale closures in listeners
  const fetchTokenRef = useRef<() => Promise<string>>(null);

  const fetchToken = async (): Promise<string> => {
    const { data, error } = await apiFetch<{ accessToken: string }>('/spotify/token');
    if (error || !data) {
      throw new Error('Failed to retrieve Spotify access token.');
    }
    return data.accessToken;
  };

  fetchTokenRef.current = fetchToken;

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

          newPlayer.addListener('ready', async ({ device_id }: { device_id: string }) => {
            setDeviceId(device_id);
            setPlayer(newPlayer);
            setErrorMsg(null);
            console.log('Spotify Player ready with Device ID:', device_id);

            // Force playback transfer to make this device primary and active
            try {
              if (fetchTokenRef.current) {
                const token = await fetchTokenRef.current();
                const res = await fetch('https://api.spotify.com/v1/me/player', {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    device_ids: [device_id],
                    play: false, // Don't start playback yet, just activate it
                  }),
                });
                
                if (!res.ok) {
                  const errJson = await res.json().catch(() => ({}));
                  if (errJson?.error?.reason === 'PREMIUM_REQUIRED' || errJson?.error?.message?.includes('Premium required')) {
                    setIsPremium(false);
                    setErrorMsg('Spotify Premium account is required to play songs directly in the browser.');
                  } else {
                    console.warn(`Playback transfer failed with status: ${res.status}`);
                  }
                } else {
                  console.log('Successfully transferred Spotify playback context to browser player.');
                }
              }
            } catch (e) {
              console.warn('Failed to automatically transfer playback to device:', e);
            }
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

  const playTrack = async (trackId: string, offsetMs = 0, retries = 2): Promise<void> => {
    if (!deviceId) return;
    try {
      if (fetchTokenRef.current) {
        const token = await fetchTokenRef.current();
        const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [`spotify:track:${trackId}`],
            position_ms: offsetMs,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson?.error?.message || '';

          if (errMsg.includes('Restriction violated')) {
            return;
          }

          console.warn(`Spotify play request failed with status: ${res.status}. Retries left: ${retries}`);
          if (retries > 0) {
            await new Promise((r) => setTimeout(r, 800));
            return playTrack(trackId, offsetMs, retries - 1);
          } else {
            if (errJson?.error?.reason === 'PREMIUM_REQUIRED' || errMsg.includes('Premium required')) {
              setIsPremium(false);
              setErrorMsg('Spotify Premium account is required to play songs directly in the browser.');
            }
          }
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
    if (!deviceId) return;
    try {
      if (fetchTokenRef.current) {
        const token = await fetchTokenRef.current();
        const res = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson?.error?.message || '';

          if (errMsg.includes('Restriction violated')) {
            return;
          }

          console.warn(`Spotify pause request failed with status: ${res.status}. Retries left: ${retries}`);
          if (retries > 0) {
            await new Promise((r) => setTimeout(r, 800));
            return pauseTrack(retries - 1);
          } else {
            if (errJson?.error?.reason === 'PREMIUM_REQUIRED' || errMsg.includes('Premium required')) {
              setIsPremium(false);
              setErrorMsg('Spotify Premium account is required to play songs directly in the browser.');
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to control pause command:', e);
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return pauseTrack(retries - 1);
      }
    }
  };

  const seekTrack = async (positionMs: number, retries = 2): Promise<void> => {
    if (!deviceId) return;
    try {
      if (fetchTokenRef.current) {
        const token = await fetchTokenRef.current();
        const res = await fetch(`https://api.spotify.com/v1/me/player/seek?device_id=${deviceId}&position_ms=${positionMs}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson?.error?.message || '';

          if (errMsg.includes('Restriction violated')) {
            return;
          }

          console.warn(`Spotify seek request failed with status: ${res.status}. Retries left: ${retries}`);
          if (retries > 0) {
            await new Promise((r) => setTimeout(r, 800));
            return seekTrack(positionMs, retries - 1);
          } else {
            if (errJson?.error?.reason === 'PREMIUM_REQUIRED' || errMsg.includes('Premium required')) {
              setIsPremium(false);
              setErrorMsg('Spotify Premium account is required to play songs directly in the browser.');
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to seek track command:', e);
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return seekTrack(positionMs, retries - 1);
      }
    }
  };

  const resumeTrack = async (retries = 2): Promise<void> => {
    if (!deviceId) return;
    try {
      if (fetchTokenRef.current) {
        const token = await fetchTokenRef.current();
        const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson?.error?.message || '';

          if (errMsg.includes('Restriction violated')) {
            return;
          }

          console.warn(`Spotify resume request failed with status: ${res.status}. Retries left: ${retries}`);
          if (retries > 0) {
            await new Promise((r) => setTimeout(r, 800));
            return resumeTrack(retries - 1);
          } else {
            if (errJson?.error?.reason === 'PREMIUM_REQUIRED' || errMsg.includes('Premium required')) {
              setIsPremium(false);
              setErrorMsg('Spotify Premium account is required to play songs directly in the browser.');
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to resume track command:', e);
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return resumeTrack(retries - 1);
      }
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
