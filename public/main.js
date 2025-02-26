// DOM elements
const videoElement = document.getElementById("avatarVideo");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const micButton = document.getElementById("micButton");

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
    const response = await fetch('/api/get-token');
    const data = await response.json();
    return data.data.token;
}

// Инициализация сессии аватара
async function startSession() {
    try {
        const token = await fetchAccessToken();
        avatar = new StreamingAvatar({ token });

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

        avatar.on('STREAM_READY', handleStreamReady);
        avatar.on('STREAM_DISCONNECTED', handleStreamDisconnected);
    } catch (error) {
        console.error('Ошибка запуска сессии:', error);
        alert('Не удалось запустить сессию: ' + error.message);
    }
}

// Обработка готовности потока
function handleStreamReady(event) {
    if (event.detail && videoElement) {
        videoElement.srcObject = event.detail;
        videoElement.onloadedmetadata = () => {
            videoElement.play().catch(console.error);
        };
    } else {
        console.error("Stream is not available");
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
    initSpeechRecognition();
}); 