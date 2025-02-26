// DOM elements
const videoElement = document.getElementById("avatarVideo");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const micButton = document.getElementById("micButton");

console.log('SDK Status:', window.HeygenStreaming);

let avatar = null;
let sessionData = null;

// Инициализация распознавания речи
let recognition = null;
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            console.log('Распознано:', text);
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: text })
                });
                
                const data = await response.json();
                if (data.response) {
                    await avatar.speak({
                        text: data.response,
                        voice_id: "81bb7c1a521442f6b812b2294a29acc1"
                    });
                }
            } catch (error) {
                console.error('Ошибка обработки голосового ввода:', error);
            }
        };
    }
}

// Получение токена доступа
async function fetchAccessToken() {
    try {
        const response = await fetch('/api/get-token');
        console.log('Token Response Status:', response.status);
        const data = await response.json();
        console.log('Token Data:', data);
        return data.data.token;
    } catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }
}

// Инициализация сессии аватара
async function startSession() {
    try {
        console.log('Starting session...');
        if (!window.StreamingAvatar) {
            throw new Error('SDK не загружен');
        }

        const token = await fetchAccessToken();
        console.log('Got token:', token);

        avatar = new window.StreamingAvatar({ token });
        console.log('Avatar instance created:', avatar);

        // Создаем RTCPeerConnection
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        // Создаем и добавляем медиа-треки
        const audioTransceiver = peerConnection.addTransceiver('audio', {
            direction: 'recvonly'
        });
        const videoTransceiver = peerConnection.addTransceiver('video', {
            direction: 'recvonly'
        });

        // Создаем оффер
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Ждем сбора ICE кандидатов
        await new Promise(resolve => {
            if (peerConnection.iceGatheringState === 'complete') {
                resolve();
            } else {
                peerConnection.addEventListener('icegatheringstatechange', () => {
                    if (peerConnection.iceGatheringState === 'complete') {
                        resolve();
                    }
                });
            }
        });

        // Создаем сессию с полным SDP
        sessionData = await avatar.createStartAvatar({
            quality: "high",
            avatar_id: "Dexter_Doctor_Standing2_public",
            voice: {
                voice_id: "81bb7c1a521442f6b812b2294a29acc1"
            },
            sdp: peerConnection.localDescription.sdp
        });

        console.log("Session data:", sessionData);

        if (!sessionData.sdp) {
            throw new Error('Нет SDP в ответе от сервера');
        }

        // Устанавливаем удаленный SDP
        await peerConnection.setRemoteDescription({
            type: 'answer',
            sdp: sessionData.sdp
        });

        // Обработка медиа-потока
        peerConnection.ontrack = (event) => {
            console.log('Got remote track:', event.streams[0]);
            if (event.streams && event.streams[0]) {
                videoElement.srcObject = event.streams[0];
                videoElement.play().catch(console.error);
            }
        };

        // Обработка состояния подключения
        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
                console.log('WebRTC connected successfully');
            }
        };

        // Обработка ошибок
        peerConnection.onicecandidateerror = (event) => {
            console.error('ICE candidate error:', event);
        };

        stopButton.disabled = false;
        startButton.disabled = true;
        micButton.disabled = false;

        // Сохраняем peerConnection для последующего использования
        window.peerConnection = peerConnection;

    } catch (error) {
        console.error('Ошибка запуска сессии:', error);
        console.error('Stack:', error.stack);
        alert('Не удалось запустить сессию: ' + error.message);
    }
}

// Обработка отключения потока
function handleStreamDisconnected() {
    console.log("Stream disconnected");
    if (videoElement) {
        videoElement.srcObject = null;
    }
    startButton.disabled = false;
    stopButton.disabled = true;
    micButton.disabled = true;
}

// Завершение сессии
async function stopSession() {
    try {
        if (window.peerConnection) {
            window.peerConnection.close();
            window.peerConnection = null;
        }

        if (videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
        }

        if (avatar && sessionData) {
            await avatar.stopAvatar();
            avatar = null;
            sessionData = null;
        }

        startButton.disabled = false;
        stopButton.disabled = true;
        micButton.disabled = true;
    } catch (error) {
        console.error('Ошибка остановки сессии:', error);
    }
}

// Обработчики событий
startButton.addEventListener("click", startSession);
stopButton.addEventListener("click", stopSession);
micButton.addEventListener("click", () => {
    if (recognition) {
        recognition.start();
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking SDK...');
    if (!window.StreamingAvatar) {
        console.error('SDK not available on DOMContentLoaded');
        alert('Ошибка загрузки SDK. Пожалуйста, перезагрузите страницу.');
        return;
    }
    console.log('SDK available:', window.StreamingAvatar);
    initSpeechRecognition();
}); 