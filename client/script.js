import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
const socket = io("https://vinymd-socketio-pub.onrender.com");

var peer = null;

const btnStart = document.getElementById('startCallButton')
const btnStop = document.getElementById('stopCallButton')
const localVideoTag = document.getElementById('localVideo')

//region websocket
socket.on("connect", () => {
    console.log("Connected websocket");
    socket.emit("subscribe", 'webrtc-answer');
    socket.emit("subscribe", 'log');
    socket.emit("subscribe", 'candidate');

    socket.on('webrtc-answer', (message) => {
        setAnswer(message.sdp)
    })

    socket.on('log', (message) => {
        console.log('Log from Server: ', message)
    })

    socket.on('candidate', (message) => {
        if(peer)
            peer.addIceCandidate(new RTCIceCandidate(message.candidate)).catch((e) => console.error(e));
    })

    btnStart.disabled = false;
});
//endregion websocket

function createPeer () {
    console.log("creating a peer connection")

    let config = {
        iceServers: [{
            urls: ['stun:stun.l.google.com:19302'],
        }]
    }
      
    peer = new RTCPeerConnection(config);

    peer.addEventListener('track', function (evt) {
        if (evt.track.kind == 'video') {
            console.log("receiving a video")

            applyContraints( evt.streams[0].getVideoTracks()[0] );

            localVideoTag.srcObject = evt.streams[0];
            localVideoTag.style.display = 'inline'
        }
    });    

    peer.addTransceiver('audio', {
        direction: 'recvonly'
    });
    peer.addTransceiver('video', {
        direction: 'recvonly'
    });
}

async function negociate () {
    console.log("negociate")

    let offer = await peer.createOffer();

    //offer.sdp = forceKbps(offer.sdp, 50)

    await peer.setLocalDescription(offer);

    peer.addEventListener("icegatheringstatechange", iceGatheringStateChangeHandler);
    peer.onicecandidate = onicecandidateHandler;

    sendOfferToServer(peer.localDescription.sdp);
}

async function onicecandidateHandler(event) {
    if (event.candidate) {
        socket.emit('broadcast', {channel: 'candidate', message: {candidate: event.candidate} })      
    }
}

async function iceGatheringStateChangeHandler() {
    try{
        let message = `iceGatheringState": ${peer.iceGatheringState}`;
        console.log(message);
        socket.emit('broadcast', {channel: 'log', message: message });
        switch (peer.iceGatheringState) {
        case "new":
            break;
        case "gathering":        
            break;
        case "complete":
            break;
        default:
            console.log("State not found");
            break;
        }
    }catch (e){
        socket.emit('broadcast', {channel: 'log', message: e })
    }
}

function applyContraints (videoTrack) {
    if (videoTrack) {
    
        const videoConstraints = {
            width: { min: 320, max: 1280 },
            height: { min: 240,  max: 720 },
            frameRate: {min: 5,  max: 5 }
        };
    
        // Apply video track constraints
        videoTrack.applyConstraints(videoConstraints)
            .then(() => {
                console.log("Video track constraints applied successfully");
            })
            .catch((error) => {
                console.error("Error applying video track constraints:", error);
                setTimeout(() => {
                    applyContraints(videoTrack);
                }, 5000);//5seg
            });
    
        // Set content hint to 'motion' or 'detail'
        videoTrack.contentHint = 'motion';
    }
}

function sendOfferToServer (offerSDP) {
    console.log('sendOfferToServer')    
    socket.emit('broadcast', {channel: 'webrtc-offer', message: {sdp: offerSDP} })
}

function setAnswer (sdp) {
    console.log('setAnswer')
    let answer = {
        sdp: sdp,
        type: 'answer'
    }
    peer.setRemoteDescription(answer);
    btnStart.disabled = true;
    btnStop.disabled = false;
}

/**
 * Call this method when you want to reduce the speed to 
 * test content hint, simulating situations when you have bad connections
 */
function forceKbps(sdp, speed){
    return sdp.replace(/a=mid:(.*)\r\n/g, 'a=mid:$1\r\nb=AS:' + speed + '\r\n');
}

//start 
function start () {
    console.log('start')
    createPeer();
    negociate();
}

function stop(){
    peer.close();
    btnStart.disabled = false;
    btnStop.disabled = true;
}


btnStart.addEventListener("click", start);
btnStop.addEventListener("click", stop);