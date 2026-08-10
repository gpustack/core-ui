import React from 'react';
import SpeechItem from './speech-item';

interface SpeechContentProps {
  dataList: any[];
  loading?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  playerRef?: React.RefObject<any>;
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

const SpeechContent: React.FC<SpeechContentProps> = (props) => {
  return (
    <div>
      {props.dataList.map((item) => (
        <SpeechItem
          key={item.uid}
          {...item}
          streamPlayer={props.streamPlayer}
          onPlay={props.onPlay}
          onPause={props.onPause}
          ref={props.playerRef}
          analyserData={props.analyserData}
        />
      ))}
    </div>
  );
};

export default SpeechContent;
