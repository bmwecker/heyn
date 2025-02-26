let sessionInfo = null;
let room = null;
let mediaStream = null;
let recognition = null;

async function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            console.log('Распознано:', text);
            await sendText(text);
        };
    }
}

async function createSession() {
    try {
        // Получаем токен с нашего сервера
        const response = await fetch('/api/create-session');
        
        sessionInfo = await response.json();
        
        await fetch('/api/start-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId: sessionInfo.session_id })
        });
        
        // Подключаемся к LiveKit
        room = new LiveKitClient.Room();
        await room.connect(sessionInfo.url, sessionInfo.access_token);
        
        // Обрабатываем медиа потоки
        room.on(LiveKitClient.RoomEvent.TrackSubscribed, (track) => {
            if (track.kind === "video" || track.kind === "audio") {
                mediaStream = new MediaStream();
                mediaStream.addTrack(track.mediaStreamTrack);
                const videoElement = document.getElementById('avatarVideo');
                videoElement.srcObject = mediaStream;
            }
        });

        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        document.getElementById('micButton').disabled = false;
    } catch (error) {
        console.error('Ошибка создания сессии:', error);
        alert('Не удалось создать сессию: ' + error.message);
    }
}

async function sendText(text) {
    try {
        await fetch('/api/send-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: sessionInfo.session_id,
                text: text
            })
        });
    } catch (error) {
        console.error('Ошибка отправки текста:', error);
    }
}

async function closeSession() {
    if (sessionInfo) {
        try {
            await fetch('/api/stop-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: sessionInfo.session_id
                })
            });
            
            if (room) {
                room.disconnect();
            }
            
            const videoElement = document.getElementById('avatarVideo');
            videoElement.srcObject = null;
            sessionInfo = null;
            room = null;
            mediaStream = null;

            document.getElementById('startButton').disabled = false;
            document.getElementById('stopButton').disabled = true;
            document.getElementById('micButton').disabled = true;
        } catch (error) {
            console.error('Ошибка закрытия сессии:', error);
        }
    }
}

document.getElementById('startButton').addEventListener('click', createSession);
document.getElementById('stopButton').addEventListener('click', closeSession);
document.getElementById('micButton').addEventListener('click', () => {
    if (recognition) {
        recognition.start();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
}); 