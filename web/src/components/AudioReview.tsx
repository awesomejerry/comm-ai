import React, { useRef, useState, useEffect } from 'react';

interface AudioReviewProps {
  audioBlob: Blob;
  onPlaybackComplete?: () => void;
}

export const AudioReview: React.FC<AudioReviewProps> = ({ audioBlob, onPlaybackComplete }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const objectUrl = URL.createObjectURL(audioBlob);
    audio.src = objectUrl;
    audio.preload = 'auto'; // Force aggressive loading
    audio.load(); // Explicitly start loading to trigger metadata

    const updateDuration = () => {
      const audioDuration = audio.duration;
      if (isFinite(audioDuration) && !isNaN(audioDuration) && audioDuration !== duration) {
        setDuration(audioDuration);
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
    };

    const handleDurationChange = () => {
      updateDuration();
    };

    const handleCanPlayThrough = () => {
      updateDuration();
    };

    const handleCanPlay = () => {
      updateDuration();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Also check duration during playback in case it wasn't available initially
      updateDuration();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onPlaybackComplete?.();
    };

    const handleError = () => {
      console.error('Audio loading error');
      setDuration(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Check duration immediately and after short delays
    updateDuration();
    setTimeout(updateDuration, 100);
    setTimeout(updateDuration, 300);
    setTimeout(updateDuration, 500);

    // Set up aggressive interval checking for duration
    const durationCheckInterval = setInterval(() => {
      updateDuration();
    }, 200);

    // Clear interval after 5 seconds
    setTimeout(() => {
      clearInterval(durationCheckInterval);
    }, 5000);

    return () => {
      URL.revokeObjectURL(objectUrl);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      clearInterval(durationCheckInterval);
    };
  }, [audioBlob, onPlaybackComplete]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-review bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Review Recording</h3>

      <audio ref={audioRef} preload="auto" />

      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlayPause}
          className="bg-commAi-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div className="flex-1">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-commAi-primary h-2 rounded-full"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        <span className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
