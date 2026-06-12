import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import { type AudioPlayerProps } from './config/type';

const RawAudioPlayer: React.FC<AudioPlayerProps> = forwardRef((props, ref) => {
  const { autoplay = false } = props;
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // =================== audio context ======================
  const audioContext = useRef<any>(null);
  const analyser = useRef<any>(null);
  const dataArray = useRef<any>(null);
  // ========================================================

  const initAudioContext = useCallback(() => {
    audioContext.current = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    analyser.current = audioContext.current.createAnalyser();
    analyser.current.fftSize = 512;
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
  }, []);

  const generateVisualData = useCallback(() => {
    const source = audioContext.current.createMediaElementSource(
      audioRef.current
    );
    source.connect(analyser.current);
    analyser.current.connect(audioContext.current.destination);
  }, []);

  // Keep the latest props accessible from the stable handlers below without
  // having to re-register listeners on every prop change.
  const propsRef = useRef(props);
  propsRef.current = props;

  // Handlers are created once so the exact same references are used for both
  // addEventListener and removeEventListener (an inline arrow function can
  // never be removed, which previously leaked listeners on every reload).
  const handlersRef = useRef<Record<string, EventListener>>();
  if (!handlersRef.current) {
    handlersRef.current = {
      play: () => {
        propsRef.current.onAnalyse?.(dataArray.current, analyser);
        propsRef.current.onPlay?.();
      },
      pause: () => {
        propsRef.current.onAnalyse?.(dataArray.current, analyser);
        propsRef.current.onPause?.();
      },
      timeupdate: () => {
        const current = audioRef.current?.currentTime || 0;
        propsRef.current.onTimeUpdate?.();
        propsRef.current.onAudioProcess?.(current);
      },
      ended: () => {
        propsRef.current.onEnded?.();
      },
      canplay: () => {
        propsRef.current.onCanPlay?.();
      },
      loadeddata: () => {
        if (!audioContext.current) {
          initAudioContext();
          generateVisualData();
        }
        propsRef.current.onLoadedData?.();
      },
      seeked: () => {
        propsRef.current.onSeeked?.();
      },
      seeking: () => {
        propsRef.current.onSeeking?.();
      },
      volumechange: () => {
        propsRef.current.onVolumeChange?.();
      },
      playing: () => {
        propsRef.current.onPlaying?.();
      },
      loadedmetadata: () => {
        const duration = audioRef.current?.duration || 0;
        propsRef.current.onLoadedMetadata?.(duration);
        propsRef.current.onReady?.(duration);
      }
    };
  }

  // AudioContext is created in a suspended state (browser autoplay policy).
  // It can only be resumed from within a user gesture, so create (if needed)
  // and resume it before every explicit play() call — otherwise the media
  // element is routed through a suspended context and never produces sound or
  // advances. Lazily initializing here (rather than relying on `loadeddata`,
  // which may fire after the first play()) guarantees the context exists and
  // is resumed within the gesture; the `loadeddata` handler's null-check then
  // skips re-creating it.
  const resumeAudioContext = () => {
    if (!audioContext.current) {
      initAudioContext();
      generateVisualData();
    }
    if (audioContext.current?.state === 'suspended') {
      audioContext.current.resume();
    }
  };

  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current) {
        resumeAudioContext();
        // If playback has ended, reset to beginning
        if (audioRef.current.currentTime >= audioRef.current.duration) {
          audioRef.current.currentTime = 0;
        }
        audioRef.current.play();
      }
    },
    pause: () => {
      audioRef.current?.pause();
    },
    seekTo: (ratio: number) => {
      if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = ratio * audioRef.current.duration;
      }
    },
    // Compatibility layer for wavesurfer interface
    wavesurfer: {
      current: {
        play: () => {
          if (audioRef.current) {
            resumeAudioContext();
            // If playback has ended, reset to beginning
            if (audioRef.current.currentTime >= audioRef.current.duration) {
              audioRef.current.currentTime = 0;
            }
            return audioRef.current.play();
          }
          return Promise.resolve();
        },
        isPlaying: () => {
          return audioRef.current ? !audioRef.current?.paused : false;
        }
      }
    }
  }));

  useEffect(() => {
    const audio = audioRef.current;
    const handlers = handlersRef.current;
    if (!audio || !handlers) {
      return;
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    };
  }, []);

  // Reload audio when URL changes
  useEffect(() => {
    if (audioRef.current && props.url) {
      audioRef.current.load();
    }
  }, [props.url]);

  return (
    <audio
      controls
      autoPlay={autoplay}
      src={props.url}
      ref={audioRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        opacity: 0
      }}
      preload="metadata"
    ></audio>
  );
});

export default RawAudioPlayer;
