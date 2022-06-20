import { makeAutoObservable } from "mobx";
import { Signaler } from "./socket";

const mediaConstraints = {
  audio: true,
  video: {
    frameRate: 30,
    facingMode: "user",
  },
};

const peerConstraints = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export class WebRTC {
  localMediaStream?: MediaStream;
  remoteMediaStream?: MediaStream;
  isVoiceOnly = false;
  peerConnection = new RTCPeerConnection(peerConstraints);
  signaler = new Signaler();
  target = "";

  setTarget(target: string) {
    this.target = target;
  }

  constructor() {
    makeAutoObservable(this);
    this.signaler.connect(this);

    this.peerConnection.addEventListener("connectionstatechange", (event) => {
      switch (this.peerConnection.connectionState) {
        case "closed":
          // You can handle the call being disconnected here.

          break;
      }
    });

    this.peerConnection.addEventListener("icecandidate", (event) => {
      // When you find a null candidate then there are no more candidates.
      // Gathering of candidates has finished.
      if (!event.candidate) {
        return;
      }

      // Send the event.candidate onto the person you're calling.
      // Keeping to Trickle ICE Standards, you should send the candidates immediately.
      this.signaler.sendMsg({
        iceCandidate: {
          candidate: event.candidate,
          from: this.signaler.id,
          target: this.target,
        },
      });
    });

    this.peerConnection.addEventListener("icecandidateerror", (event) => {
      // You can ignore some candidate errors.
      // Connections can still be made even when errors occur.
    });

    this.peerConnection.addEventListener(
      "iceconnectionstatechange",
      (event) => {
        switch (this.peerConnection.iceConnectionState) {
          case "connected":
          case "completed":
            // You can handle the call being connected here.
            // Like setting the video streams to visible.

            break;
        }
      }
    );

    this.peerConnection.addEventListener("negotiationneeded", (event) => {
      console.log("negotiationneeded");
      // You can start the offer stages here.
      // Be careful as this event can be called multiple times.
      this.createOffer();
    });

    this.peerConnection.addEventListener("signalingstatechange", (event) => {
      switch (this.peerConnection.signalingState) {
        case "closed":
          // You can handle the call being disconnected here.

          break;
      }
    });

    this.peerConnection.addEventListener("track", (event) => {
      // Grab the remote stream from the connected participant.
      this.setRemoteMediaStreamTrack(event.track);
    });

    this.peerConnection.addEventListener("addstream", (event) => {
      // Grab the remote stream from the connected participant.
      // this.setRemoteMediaStream(event[0]);
    });
  }

  setRemoteMediaStreamTrack(track: MediaStreamTrack) {
    if (this.remoteMediaStream) {
      this.remoteMediaStream.addTrack(track);
    }
    this.remoteMediaStream = new MediaStream([track]);
  }

  tracks: RTCRtpSender[] = [];

  addTrack(track: RTCRtpSender) {
    this.tracks.push(track);
  }

  *startLocalMediaStream() {
    const mediaStream = (yield navigator.mediaDevices.getUserMedia(
      mediaConstraints
    )) as MediaStream;

    if (this.isVoiceOnly) {
      let videoTrack = mediaStream.getVideoTracks()[0];
      videoTrack.enabled = false;
    }

    this.localMediaStream = mediaStream;
    const mediaTracks = this.localMediaStream.getTracks();
    const ids = this.tracks.map((t) => t.track?.id).filter(Boolean) as string[];

    mediaTracks.forEach((mediaTrack) => {
      if (ids.includes(mediaTrack.id)) return;
      // Add our tracks to the peer connection.
      this.addTrack(this.peerConnection.addTrack(mediaTrack));
    });
  }

  releaseLocalMediaStream() {
    if (this.localMediaStream) {
      // this.localMediaStream.release();
      this.localMediaStream = undefined;

      this.tracks.forEach((track) => {
        this.peerConnection.removeTrack(track);
      });

      this.tracks = [];
    }
  }

  setupPeer() {
    this.peerConnection = new RTCPeerConnection(peerConstraints);
  }

  localDescription?: RTCLocalSessionDescriptionInit;

  setLocalDescription(session: RTCLocalSessionDescriptionInit) {
    this.peerConnection.setLocalDescription(session);
    this.localDescription = session;
  }

  async createOffer() {
    console.log("Offering!");
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      this.setLocalDescription(offer);

      this.signaler.sendMsg({
        videoOffer: {
          from: this.signaler.id,
          target: this.target,
          offer,
        },
      });
    } catch (error) {}
  }

  async handleVideoOfferMsg(offer: RTCSessionDescriptionInit) {
    const remoteDescription = new RTCSessionDescription(offer);
    await this.peerConnection.setRemoteDescription(remoteDescription);
    await this.startLocalMediaStream();
    const answer = await this.peerConnection.createAnswer();
    this.setLocalDescription(answer);

    this.signaler.sendMsg({
      videoAnswer: {
        from: this.signaler.id,
        target: this.target,
        answer,
      },
    });
  }

  async handleVideoAnswerMsg(answer: RTCSessionDescriptionInit) {
    const remoteDescription = new RTCSessionDescription(answer);
    await this.peerConnection.setRemoteDescription(remoteDescription);
  }

  handleNewICECandidateMsg(remoteCandidate: RTCIceCandidateInit) {
    const candidate = new RTCIceCandidate(remoteCandidate);
    this.peerConnection.addIceCandidate(candidate);
  }

  save() {
    this.signaler.sendMsg({
      save: {
        id: this.signaler.id,
        session: this.localDescription,
      },
    });
  }
}
