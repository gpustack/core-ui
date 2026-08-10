import {
  DownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { Button, Slider, Tooltip } from 'antd';
import dayjs from 'dayjs';
import _, { throttle } from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import AudioAnimation from '../../../lib/components/audio-animation';
import { useIntl } from '../../../lib/hooks/useIntl';
import RawAudioPlayer from '../audio-player/raw-audio-player';
import './styles/index.less';
import './styles/slider-progress.less';

const audioFormat = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/aac': 'aac',
  'audio/x-flac': 'flac',
  'audio/pcm': 'pcm',
  'audio/flac': 'flac',
  'audio/x-wav': 'wav',
  'audio/L16': 'pcm',
  'audio/opus': 'opus'
};

interface SpeechContentProps {
  ref?: any;
  prompt: string;
  autoplay: boolean;
  voice: string;
  format: string;
  speed: number;
  audioUrl: string;
  onPlay?: () => void;
  onPause?: () => void;
  /**
   * State and controls of a stream played by the caller's own player instead of
   * by an audio element. `duration` stays 0 until generation ends — seeking and
   * downloading unlock at that point, pause / resume works throughout.
   */
  streamPlayer?: {
    isPlaying?: boolean;
    currentTime?: number;
    duration?: number;
    downloadUrl?: string;
    onSeek?: (position: number) => void;
  };
  analyserData?: {
    data: Uint8Array;
    analyser: any;
  };
}
const SpeechItem: React.FC<SpeechContentProps> = forwardRef(
  (props, playerRef) => {
    const intl = useIntl();
    const [isPlay, setIsPlay] = useState(props.autoplay);
    const [duration, setDuration] = useState<number>(0);
    const [animationSize, setAnimationSize] = useState({
      width: 900,
      height: 0
    });
    const [currentTime, setCurrentTime] = useState(0);
    const [seekingValue, setSeekingValue] = useState<number | null>(null);
    const [audioChunks, setAudioChunks] = useState<any>({
      data: new Uint8Array(128),
      analyser: null
    });
    const wrapper = useRef<any>(null);
    const ref = useRef<any>(null);

    // A PCM stream is played by the caller's own player instead of by an audio
    // element, so for those items every playback state comes from props.
    const isPCMStream = useMemo(() => {
      return props.audioUrl?.startsWith('pcm-stream://');
    }, [props.audioUrl]);

    const stream = isPCMStream ? props.streamPlayer : undefined;
    const playing = stream ? !!stream.isPlaying : isPlay;

    // Sync internal ref with external playerRef if provided

    useImperativeHandle(playerRef, () => {
      return {
        playerRef: ref.current
      };
    }, [ref.current]);

    const onPause = () => {
      ref.current?.pause();
      props.onPause?.();
    };

    const onPlay = async () => {
      await ref.current?.wavesurfer.current?.play();
      props.onPlay?.();
    };

    const handlePlay = async () => {
      // A stream is not ours to control: report the intent and let the caller's
      // player decide, it owns `isPlaying`.
      if (isPCMStream) {
        if (playing) {
          props.onPause?.();
        } else {
          props.onPlay?.();
        }
        return;
      }

      try {
        if (ref.current?.wavesurfer.current?.isPlaying()) {
          onPause();
          setIsPlay(false);
          return;
        } else {
          await onPlay();
          setIsPlay(true);
        }
      } catch (error) {
        console.log('error:', error);
      }
    };

    const handleOnAnalyse = useCallback((data: any, analyser: any) => {
      setAudioChunks((pre: any) => {
        return {
          data: data,
          analyser: analyser
        };
      });
    }, []);

    const handleOnFinish = useCallback(() => {
      setIsPlay(false);
    }, []);

    const handleOnPlay = useCallback(() => {
      setIsPlay(true);
    }, []);

    const handleOnPause = useCallback(() => {
      setIsPlay(false);
    }, []);

    const throttleUpdateCurrentTime = throttle((current: number) => {
      setCurrentTime(current);
    }, 100);

    const handleOnAudioprocess = (current: number) => {
      throttleUpdateCurrentTime(current);
    };

    const handleAnimationResize = useCallback((size: any) => {
      setAnimationSize({
        width: size.width,
        height: size.height
      });
    }, []);

    const debounceSeek = _.debounce((value: number) => {
      ref.current?.seekTo(value / duration);
      setCurrentTime(value);
    }, 200);

    const handleSliderChange = (value: number) => {
      // A stream reports its position through props, so let the thumb follow the
      // drag locally and commit once — reseeking a stream means requeueing all
      // of its remaining audio.
      if (stream) {
        setSeekingValue(value);
        return;
      }
      debounceSeek(value);
    };

    const handleSliderChangeComplete = (value: number) => {
      if (!stream) return;
      setSeekingValue(null);
      stream.onSeek?.(value);
    };

    const handleReady = useCallback((duration: number) => {
      setDuration(duration);
    }, []);

    const convertFormat = () => {
      if (props.format === 'pcm') {
        return 'wav';
      }
      return props.format;
    };

    const onDownload = useCallback(() => {
      const url = stream?.downloadUrl || props.audioUrl || '';
      const filename = `audio-${dayjs().format('YYYYMMDDHHmmss')}.${convertFormat()}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }, [props.audioUrl, props.format]);

    // Pause / resume works throughout — for a stream it is the caller's player
    // that answers, otherwise the audio element. Seeking and downloading need
    // the whole audio: for an element that means metadata has loaded, for a
    // stream that generation has ended (its length is what reports that).
    const renderPlayerActions = () => {
      const hasCompleteAudio = !!props.audioUrl && duration > 0;
      // A stream reports no length while it is still being generated: there is
      // no total to measure a position against yet, so the bar stays empty.
      const generating = !!stream && !stream.duration;
      const totalDuration = stream ? stream.duration || 0 : duration;
      const position = generating
        ? 0
        : stream
          ? (seekingValue ?? stream.currentTime ?? 0)
          : currentTime;
      const canPlay = stream ? true : hasCompleteAudio;
      const canSeek = stream ? !generating : hasCompleteAudio;
      const canDownload = stream ? !!stream.downloadUrl : hasCompleteAudio;

      return (
        <div>
          <Slider
            className="slider-progress"
            value={position}
            max={totalDuration}
            step={0.01}
            disabled={!canSeek}
            onChange={handleSliderChange}
            onChangeComplete={handleSliderChangeComplete}
          ></Slider>
          <div className="speech-actions">
            <span className="tags">
              <span className="item">{props.format}</span>
            </span>
            <span className="duration">
              {generating
                ? ''
                : _.round(position, 2) || _.round(totalDuration, 2)}
            </span>
            <div className="actions">
              <Tooltip
                title={
                  playing
                    ? intl.formatMessage({ id: 'playground.audio.button.stop' })
                    : intl.formatMessage({ id: 'playground.audio.button.play' })
                }
              >
                <Button
                  disabled={!canPlay}
                  onClick={handlePlay}
                  icon={
                    playing ? (
                      <PauseCircleOutlined className="font-size-16" />
                    ) : (
                      <PlayCircleOutlined className="font-size-16" />
                    )
                  }
                  type="text"
                  size="small"
                ></Button>
              </Tooltip>
              <Tooltip
                title={intl.formatMessage({
                  id: 'playground.audio.button.download'
                })}
              >
                <Button
                  disabled={!canDownload}
                  onClick={onDownload}
                  icon={<DownloadOutlined className="font-size-16" />}
                  type="text"
                  size="small"
                ></Button>
              </Tooltip>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div className="speech-item">
          <div
            className="wrapper"
            style={{ height: 120, width: '100%' }}
            ref={wrapper}
          >
            <>
              {!isPCMStream && (
                <RawAudioPlayer
                  {...props}
                  url={props.audioUrl}
                  onReady={handleReady}
                  onEnded={handleOnFinish}
                  onPlay={handleOnPlay}
                  onPause={handleOnPause}
                  onAnalyse={handleOnAnalyse}
                  onAudioProcess={handleOnAudioprocess}
                  ref={ref}
                ></RawAudioPlayer>
              )}
              {playing &&
                (props.analyserData?.analyser?.current ||
                  audioChunks.analyser?.current) && (
                  <AudioAnimation
                    maxBarCount={100}
                    amplitude={60}
                    fixedHeight={true}
                    height={120}
                    width={800}
                    analyserData={props.analyserData || audioChunks}
                  ></AudioAnimation>
                )}
            </>
          </div>
        </div>
        {renderPlayerActions()}
      </div>
    );
  }
);

export default SpeechItem;
