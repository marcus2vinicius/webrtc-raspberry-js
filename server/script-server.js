import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
const socket = io("https://vinymd-socketio-pub.onrender.com");

var peer = null;

//region websocket
socket.on("connect", () => {
    console.log("Connected websocket");
    socket.emit("subscribe", 'webrtc-offer');
    socket.emit("subscribe", 'candidate');

    socket.on('webrtc-offer', (message) => {
        console.log('receive msg from websocket')
        socket.emit('broadcast', {channel: 'log', message: {msg: 'receive msg from websocket' } })
        showDevices();
        createPeer(message.sdp)
    })

    socket.on('candidate', (message) => {
        if(peer)
            peer.addIceCandidate(new RTCIceCandidate(message.candidate)).catch((e) => console.error(e));
    })
});
//endregion websocket

function createPeer (offerSDP) {
    socket.emit('broadcast', {channel: 'log', message: {msg: 'createPeer()'} })

    let config = {
        iceServers: [{
            urls: ['stun:stun.l.google.com:19302'],
        }]
    }
    
    peer = new RTCPeerConnection(config);

    try{
        captureCamera(offerSDP);

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

async function handleICEConnectionStateChange(event) {
    try{
        let message = "iceConnectionState: "+ peer.iceConnectionState;
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

async function onicecandidateHandler(event) {
    if (event.candidate) {
        socket.emit('broadcast', {channel: 'candidate', message: {candidate: event.candidate} })      
    }
}



async function showDevices() {    
    let devices = (await navigator.mediaDevices.enumerateDevices()).filter(i=> i.kind == 'videoinput')
    socket.emit('broadcast', {channel: 'log', message: devices })
}

function captureCamera (sdpOffer) {
    socket.emit('broadcast', {channel: 'log', message: {msg: 'captureCamera()'} })

    let constraints = {
        audio: false,
        /**
         * case multple cameras you can get device id(`showDevices();`) and set here
         */
        
        video: {            
            deviceId: { exact: 'cba2853b37d8b806508a3ed345a4f2fee38e655bd97ebd8b56b17e739ce60f4d' }
        }                
        
       //video: true
    }; 

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        stream.getTracks().forEach(function(track) {

            applyContraints(track);

            peer.addTrack(track, stream);

        });
        return createAnswer(sdpOffer);
    }, function(err) {
        socket.emit('broadcast', {channel: 'log', message: {msg: 'Could not acquire media: ' + err} })
        console.error('Could not acquire media: ' + err);
    });
}

/**
 * Call this method when you want to reduce the speed to 
 * test content hint, simulating situations when you have bad connections
 */
function forceKbps(sdp, speed){
    return sdp.replace(/a=mid:(.*)\r\n/g, 'a=mid:$1\r\nb=AS:' + speed + '\r\n');
}

async function createAnswer (sdp) {
    socket.emit('broadcast', {channel: 'log', message: {msg: 'createAnswer' } })
    let offer = new RTCSessionDescription({sdp: sdp, type: 'offer'})
    await peer.setRemoteDescription(offer)
    let answer = await peer.createAnswer()
    
    //answer.sdp = forceKbps(answer.sdp, 50)

    await peer.setLocalDescription(answer);

    peer.addEventListener("icegatheringstatechange", iceGatheringStateChangeHandler);
    peer.oniceconnectionstatechange = handleICEConnectionStateChange;
    peer.onicecandidate = onicecandidateHandler;

    sendAnswerToBrowser(peer.localDescription.sdp);
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

function sendAnswerToBrowser(answerSDP) {
    console.log('sendAnswerToBrowser')
    socket.emit('broadcast', {channel: 'webrtc-answer', message: {sdp: answerSDP} })
}
