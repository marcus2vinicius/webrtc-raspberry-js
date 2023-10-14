import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
const socket = io("https://vinymd-socketio-pub.onrender.com");

var peer = null;

//region websocket
socket.on("connect", () => {
    console.log("Connected websocket");
    socket.emit("subscribe", 'webrtc-offer');

    socket.on('webrtc-offer', (message) => {
        console.log('receive msg from websocket')
        createPeer(message.sdp)
    })
});
//endregion websocket

function createPeer (offerSDP) {
    let config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    };
    
    peer = new RTCPeerConnection();
    
    captureCamera(offerSDP);
}

async function showDevices() {    
    let devices = (await navigator.mediaDevices.enumerateDevices()).filter(i=> i.kind == 'videoinput')
    console.log(devices)
}

function captureCamera (sdpOffer) {
    let constraints = {
        audio: false,
        /*
        video: {            
            deviceId: { exact: '4e9606ec398f795755efea4f4b75f206f5b5140f5a9ee8ee51e81154c220f97a' }
        }                
        */
       video: true
    }; 

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        stream.getTracks().forEach(function(track) {

            applyContraints(track);

            peer.addTrack(track, stream);            
        });
        return createAnswer(sdpOffer);
    }, function(err) {
        alert('Could not acquire media: ' + err);
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
    let offer = new RTCSessionDescription({sdp: sdp, type: 'offer'})
    await peer.setRemoteDescription(offer)
    let answer = await peer.createAnswer()
    
    //answer.sdp = forceKbps(answer.sdp, 50)

    await peer.setLocalDescription(answer)

    sendAnswerToBrowser(peer.localDescription.sdp)
}

function applyContraints (videoTrack) {
    if (videoTrack) {
    
        const videoConstraints = {
            width: { min: 320, max: 1280 },
            height: { min: 240,  max: 720 },
            frameRate: {min: 15,  max: 30 }
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
