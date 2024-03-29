import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
const socket = io("https://vinymd-socketio-pub.onrender.com");

var peer = null;
var candidates = [];
var offer = null;

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
        if(message.from === 'server') {
            if (peer && peer.remoteDescription) {
                peer.addIceCandidate(new RTCIceCandidate(message.candidate)).catch((e) => console.error(e));
            } else {
                candidates.push(message.candidate);
                console.warn(`Added candidate in list: ${candidates.length}`);
            }
        }else
            console.warn('Ignoring myself candidate');
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

    peer.onicegatheringstatechange = icegatheringstatechange;
    peer.onicecandidate = icecandidateHandler;
    peer.oniceconnectionstatechange = iceConnectionStateChangeHandler;
    peer.onicecandidateerror = icecandidateerrorHandler;
    peer.onconnectionstatechange = connectionstatechangeHandler;

    peer.addEventListener('track', function (evt) {
        if (evt.track.kind == 'video') {
            console.log("receiving a video");

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

    offer = await peer.createOffer();

    //offer.sdp = forceKbps(offer.sdp, 50)

    await sendOfferToServer(offer.sdp);
}

async function icecandidateHandler(event) {
    if (event.candidate) {
        //console.log(`Send candidate ${JSON.stringify(event.candidate)}`)
        await socket.emit('broadcast', {channel: 'candidate',
            message: {
            candidate: event.candidate,
            from: "client"
        } })
    }
}

async function icegatheringstatechange() {
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

async function iceConnectionStateChangeHandler(event) {
    try{
        let message = `iceConnectionState:  ${peer.iceConnectionState}`;
        console.log(message);
        socket.emit('broadcast', {channel: 'log', message: message });
        switch (peer.iceConnectionState) {
            case "new":
                break;
            case "completed":
                break;
            case "disconnected":
                break;
        }
    }catch (e){
        socket.emit('broadcast', {channel: 'log', message: e })
    }
}

async function icecandidateerrorHandler(event){
    console.error(event);
}

async function connectionstatechangeHandler() {
    // ICEConnection: new -> checking -> connected -> completed -> disconnected -> closed -> failed
    console.log(`Connection State: ${peer.connectionState}`);
    switch (peer.connectionState) {
        case "disconnected":
            console.warn("Disconnected - wait recover connection")
            break;
        case "closed":
        case "failed":
            console.warn("Implemente try to reconnect...")
            break;
        case "connected":
            console.log("webRTC Connected!!!")
            break;
    }
}

async function sendOfferToServer (offerSDP) {
    console.log('sendOfferToServer')    
    await socket.emit('broadcast', {channel: 'webrtc-offer', message: {sdp: offerSDP} })
}

async function setAnswer (sdp) {
    console.log('setAnswer')
    let answer = {
        sdp: sdp,
        type: 'answer'
    }

    peer.setLocalDescription(offer);
    console.log("Applied Local Description");

    await peer.setRemoteDescription(answer);
    console.log("Applied Remote Description");

    candidates.forEach(c=>{
        console.log('Added candidates on peer');
        peer.addIceCandidate(new RTCIceCandidate(c)).catch((e) => console.error(e));
    });
    candidates = [];

    btnStart.disabled = true;
    btnStop.disabled = false;
}

/**
 * Call this method when you want to reduce the speed to 
 * test content hint, simulating situations when you have bad connections
 */
function forceKbps(sdp, speed){
    console.warn(`Forcekbps - ${speed} kbps`)
    return sdp.replace(/a=mid:(.*)\r\n/g, 'a=mid:$1\r\nb=AS:' + speed + '\r\n');
}

//start 
async function start () {
    console.log('start')
    createPeer();
    await negociate();
}

function stop(){
    peer.close();
    btnStart.disabled = false;
    btnStop.disabled = true;
}


btnStart.addEventListener("click", start);
btnStop.addEventListener("click", stop);