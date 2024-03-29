import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
const socket = io("https://vinymd-socketio-pub.onrender.com");

var peer = null;
var candidates = [];
var mediaStream = null;
var mediaStreamTrack = null;

await captureCamera();

//region websocket
socket.on("connect", async () => {
    console.log("Connected websocket");
    socket.emit("subscribe", 'webrtc-offer');
    socket.emit("subscribe", 'candidate');

    socket.on('webrtc-offer', async (message) => {
        console.log('receive msg from websocket')
        socket.emit('broadcast', {channel: 'log', message: {msg: 'receive msg from websocket' } })
        await createPeer(message.sdp);
        showDevices();
    })

    socket.on('candidate', (message) => {
        if(message.from === "client") {
            if (peer && peer.remoteDescription) {
                peer.addIceCandidate(new RTCIceCandidate(message.candidate)).catch((e) => console.error(e));
            } else {
                candidates.push(new RTCIceCandidate(message.candidate));
                console.warn(`Added candidate in list: ${candidates.length}`);
            }
        }else
            console.warn("Ignoring myself candidate")
    })
});
//endregion websocket

async function createPeer (offerSDP) {
    console.log("Create Peer")
    socket.emit('broadcast', {channel: 'log', message: {msg: 'createPeer()'} })

    let config = {
        iceServers: [{
            urls: ['stun:stun.l.google.com:19302'],
        }]
    }
    
    peer = new RTCPeerConnection(config);

    peer.onicegatheringstatechange = iceGatheringStateChangeHandler;
    peer.oniceconnectionstatechange = iceConnectionStateChangeHandler;
    peer.onicecandidate = icecandidateHandler;
    peer.onicecandidateerror = icecandidateerrorHandler;
    peer.onconnectionstatechange = connectionstatechangeHandler;

    try{
        peer.addTrack(mediaStreamTrack, mediaStream);
        await createAnswer(offerSDP);

    }catch (e){
        socket.emit('broadcast', {channel: 'log', message: e })
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

async function icecandidateHandler(event) {
    //console.log(`Send candidate ${JSON.stringify(event.candidate)}`);
    if (event.candidate) {
        await socket.emit('broadcast', {channel: 'candidate',
            message: {
                candidate: event.candidate,
                from: "server"
            }
        });
    }
}



async function showDevices() {
    //Ask user to allow permission to camera on browser
    //Execute: await navigator.mediaDevices.getUserMedia({video: true})

    let devices = (await navigator.mediaDevices.enumerateDevices()).filter(i=> i.kind == 'videoinput')
    socket.emit('broadcast', {channel: 'log', message: devices })
}

async function captureCamera () {
    socket.emit('broadcast', {channel: 'log', message: {msg: 'captureCamera()'} })

    let constraints = {
        audio: false,
        /**
         * case multiple cameras you can get deviceId executing `showDevices();' and set here
         */
        
        video: {            
            deviceId: { exact: '275f9a3028e2b10fbcc03dc08da532b84ddead502032f9797eb110f16074e974' }
        }                
        
       //video: true
    }; 

    await navigator.mediaDevices.getUserMedia(constraints).then(async function(stream) {
        stream.getTracks().forEach(function(track) {

            applyContraints(track);

            mediaStreamTrack = track;
            mediaStream = stream;

            console.log("Video Captured");
        });

    }, function(err) {
        socket.emit('broadcast', {channel: 'log', message: {msg: 'Could not acquire media: ' + err} })
        console.error(`Could not acquire media: ${err}`);
    });
}

/**
 * Call this method when you want to reduce the speed to 
 * test content hint, simulating situations when you have bad connections
 */
function forceKbps(sdp, speed){
    console.warn(`Forcekbps - ${speed} kbps`)
    return sdp.replace(/a=mid:(.*)\r\n/g, 'a=mid:$1\r\nb=AS:' + speed + '\r\n');
}

async function createAnswer (sdp) {
    console.log("Create Answer");
    socket.emit('broadcast', {channel: 'log', message: {msg: 'createAnswer' } })

    let offer = new RTCSessionDescription({sdp: sdp, type: 'offer'});
    await peer.setRemoteDescription(offer);
    console.log("Applied Remote Description");

    let answer = await peer.createAnswer();
    await sendAnswerToBrowser(answer.sdp);
    
    //answer.sdp = forceKbps(answer.sdp, 50)

    peer.setLocalDescription(answer);//take care about 'await' because can to consider delay on apply candidates
    console.log("Applied Local Description");

    candidates.forEach(c=>{
        console.log('Added candidates on peer');
        peer.addIceCandidate(c).catch((e)=> console.error(e));
    });

    candidates = [];
}

function applyContraints (videoTrack) {
    socket.emit('broadcast', {channel: 'log', message: {msg: 'applyContraints' } })
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
                    applyContraints();
                }, 5000);//5seg
            });
    
        // Set content hint to 'motion' or 'detail'
        videoTrack.contentHint = 'motion';
    }
}

async function sendAnswerToBrowser(answerSDP) {
    console.log('sendAnswerToBrowser')
    await socket.emit('broadcast', {channel: 'webrtc-answer', message: {sdp: answerSDP} })
}