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
        if (!window.HeygenStreaming) {
            console.error('SDK not loaded:', window.HeygenStreaming);
            throw new Error('SDK не загружен');
        }

        const token = await fetchAccessToken();
        console.log('Got token:', token);

        avatar = new window.HeygenStreaming.StreamingAvatar({ token });
        console.log('Avatar instance created:', avatar);

        sessionData = await avatar.createStartAvatar({
            quality: "high",
            avatar_id: "Dexter_Doctor_Standing2_public",
            voice: {
                voice_id: "81bb7c1a521442f6b812b2294a29acc1"
            }
        });

        console.log("Session data:", sessionData);

        stopButton.disabled = false;
        startButton.disabled = true;
        micButton.disabled = false;

        console.log('Setting up event listeners...');
        avatar.on(window.HeygenStreaming.StreamingEvents.STREAM_READY, handleStreamReady);
        avatar.on(window.HeygenStreaming.StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
        console.log('Event listeners set up');
    } catch (error) {
        console.error('Ошибка запуска сессии:', error);
        console.error('Stack:', error.stack);
        alert('Не удалось запустить сессию: ' + error.message);
    }
}

// Обработка готовности потока
function handleStreamReady(event) {
    console.log('Stream ready event:', event);
    if (event.detail && videoElement) {
        videoElement.srcObject = event.detail;
        videoElement.onloadedmetadata = () => {
            console.log('Video metadata loaded, playing...');
            videoElement.play().catch(console.error);
        };
    } else {
        console.error("Stream is not available", {
            event: event,
            detail: event?.detail,
            videoElement: videoElement
        });
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
    if (!avatar || !sessionData) return;

    await avatar.stopAvatar();
    videoElement.srcObject = null;
    avatar = null;
    
    startButton.disabled = false;
    stopButton.disabled = true;
    micButton.disabled = true;
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
    if (!window.HeygenStreaming) {
        console.error('SDK not available on DOMContentLoaded');
        alert('Ошибка загрузки SDK. Пожалуйста, перезагрузите страницу.');
        return;
    }
    console.log('SDK available:', window.HeygenStreaming);
    initSpeechRecognition();
}); 