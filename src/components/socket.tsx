import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { WebRTC } from "./webrtc";

export class Signaler {
  id = "";
  connection?: WebSocket;

  setId(id: string) {
    this.id = id;
  }

  constructor() {
    makeAutoObservable(this);
  }

  sendMsg(body: any) {
    this.connection?.send(JSON.stringify(body));
  }

  webrtc?: WebRTC;

  connect(webrtc?: WebRTC) {
    this.webrtc = webrtc;
    console.log("construindo!");
    this.connection = new WebSocket("wss://192.168.1.7:8443");

    this.connection.onopen = (evt) => {
      console.log("***ONOPEN");
    };

    this.connection.onmessage = (evt) => {
      console.log("***ONMESSAGE");

      type Body = {
        videoOffer?: {
          from: string;
          target: string;
          offer: RTCSessionDescriptionInit;
        };
        videoAnswer?: {
          from: string;
          target: string;
          answer: RTCSessionDescriptionInit;
        };
        iceCandidate?: {
          candidate: RTCIceCandidateInit;
          target: string;
          from: string;
        };
      };

      const msg: Body = JSON.parse(evt.data);
      console.log("Message received: ");
      console.dir(evt.data);

      if (msg.videoOffer) {
        this.webrtc?.setTarget(msg.videoOffer.from);
        this.webrtc?.handleVideoOfferMsg(msg.videoOffer.offer);
      }

      if (msg.videoAnswer) {
        this.webrtc?.setTarget(msg.videoAnswer.from);
        this.webrtc?.handleVideoAnswerMsg(msg.videoAnswer.answer);
      }

      if (msg.iceCandidate) {
        this.webrtc?.handleNewICECandidateMsg(msg.iceCandidate.candidate);
      }
    };
  }
}

export const Socket = observer(() => {
  const [socketMsgr] = useState(() => new Signaler());

  return (
    <div style={{ border: "1px solid black", margin: 8 }}>
      <label htmlFor="socketid">ID</label>
      <input
        id="socketid"
        type="text"
        value={socketMsgr.id}
        onChange={(e) => socketMsgr.setId(e.target.value)}
      />
      Socket baby
      <button onClick={() => socketMsgr.connect()}>Connect</button>
    </div>
  );
});
