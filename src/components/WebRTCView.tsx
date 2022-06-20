import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { WebRTC } from "./webrtc";
import { sendSignal } from "./signal";

const VideoView = ({ stream }: { stream: MediaStream }) => {
  const videoEl = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (stream && videoEl.current) {
      videoEl.current.srcObject = stream;
    }
  }, [videoEl, stream]);

  return <video controls autoPlay ref={videoEl}></video>;
};

export const WebRTCView = observer(() => {
  const [webrtc] = useState(() => new WebRTC());

  return (
    <div>
      <div>
        ID:
        <input
          type="text"
          value={webrtc.signaler.id}
          onChange={(e) => webrtc.signaler.setId(e.target.value)}
        />
        Target:
        <input
          type="text"
          value={webrtc.target}
          onChange={(e) => webrtc.setTarget(e.target.value)}
        />
      </div>
      <div>
        {webrtc.localMediaStream && (
          <VideoView stream={webrtc.localMediaStream} />
        )}
        <button onClick={() => webrtc.startLocalMediaStream()}>
          startLocalMediaStream
        </button>
        <button onClick={() => webrtc.releaseLocalMediaStream()}>
          releaseLocalMediaStream
        </button>
        <button onClick={() => webrtc.save()}>save</button>
      </div>

      <button
        onClick={() => {
          (window as any).webrtc = webrtc;
        }}
      >
        log
      </button>

      {webrtc.remoteMediaStream && (
        <VideoView stream={webrtc.remoteMediaStream} />
      )}
    </div>
  );
});
