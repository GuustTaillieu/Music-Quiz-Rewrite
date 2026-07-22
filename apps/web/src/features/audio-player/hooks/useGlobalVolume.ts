import { useState, useEffect } from 'react';

// Singleton global volume value
let globalVolume = parseFloat(
  typeof window !== 'undefined'
    ? localStorage.getItem('spotify-quiz-volume') || '0.5'
    : '0.5',
);
const listeners = new Set<(vol: number) => void>();

export const getGlobalVolume = () => globalVolume;

export const setGlobalVolume = (vol: number) => {
  globalVolume = vol;
  if (typeof window !== 'undefined') {
    localStorage.setItem('spotify-quiz-volume', vol.toString());
    // Sync all HTML5 audio elements on the page
    const audios = document.querySelectorAll('audio');
    audios.forEach((audio) => {
      audio.volume = vol;
    });
  }
  listeners.forEach((listener) => listener(vol));
};

export const useGlobalVolume = () => {
  const [vol, setVol] = useState(globalVolume);

  useEffect(() => {
    const handleVolumeChange = (newVol: number) => {
      setVol(newVol);
    };
    listeners.add(handleVolumeChange);
    return () => {
      listeners.delete(handleVolumeChange);
    };
  }, []);

  return [vol, setGlobalVolume] as const;
};
