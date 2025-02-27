// DOM elements
const videoElement = document.getElementById("avatarVideo");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const micButton = document.getElementById("micButton");
const statusDiv = document.getElementById("status");

let avatar = null;
let sessionData = null;

// Получение токена доступа
async function fetchAccessToken() {
    try {
        const response = await fetch('/api/get-token');
        if (!response.ok) {
            throw new Error('Ошибка получения токена');
        }
        const data = await response.json();
        return data.data.token;
    } catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }
}

// Инициализация сессии аватара
async function startSession() {
    try {
        statusDiv.textContent = 'Запуск сессии...';
        const token = await fetchAccessToken();
        
        // Создаем экземпляр аватара
        avatar = new StreamingAvatar({ token });
        
        // Запускаем сессию
        sessionData = await avatar.createStartAvatar({
            quality: "high",
            avatar_id: "Dexter_Doctor_Standing2_public",
            disableIdleTimeout: true,
            language: "ru"
        });

        // Настраиваем обработчики событий
        avatar.on('STREAM_READY', handleStreamReady);
        avatar.on('STREAM_DISCONNECTED', handleStreamDisconnected);
        avatar.on('USER_START', () => {
            statusDiv.textContent = 'Слушаю...';
        });
        avatar.on('USER_STOP', () => {
            statusDiv.textContent = 'Обработка...';
        });
        avatar.on('AVATAR_START_TALKING', () => {
            statusDiv.textContent = 'Аватар говорит...';
        });
        avatar.on('AVATAR_STOP_TALKING', () => {
            statusDiv.textContent = 'Ожидание...';
        });

        // Обновляем состояние кнопок
        stopButton.disabled = false;
        startButton.disabled = true;
        micButton.disabled = false;

    } catch (error) {
        console.error('Ошибка запуска сессии:', error);
        statusDiv.textContent = 'Ошибка: ' + error.message;
    }
}

// Обработка готовности потока
function handleStreamReady(event) {
    if (event.detail) {
        videoElement.srcObject = event.detail;
        videoElement.play().catch(console.error);
        statusDiv.textContent = 'Поток готов';
    }
}

// Обработка отключения
function handleStreamDisconnected() {
    videoElement.srcObject = null;
    startButton.disabled = false;
    stopButton.disabled = true;
    micButton.disabled = true;
    statusDiv.textContent = 'Отключено';
}

// Завершение сессии
async function stopSession() {
    try {
        if (avatar) {
            await avatar.stopAvatar();
            videoElement.srcObject = null;
            avatar = null;
            sessionData = null;
        }
        startButton.disabled = false;
        stopButton.disabled = true;
        micButton.disabled = true;
        statusDiv.textContent = 'Сессия завершена';
    } catch (error) {
        console.error('Ошибка остановки сессии:', error);
        statusDiv.textContent = 'Ошибка остановки: ' + error.message;
    }
}

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
            statusDiv.textContent = 'Распознано: ' + text;
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: text })
                });
                
                const data = await response.json();
                if (data.response && avatar) {
                    await avatar.speak({
                        text: data.response,
                        voice_id: "81bb7c1a521442f6b812b2294a29acc1"
                    });
                }
            } catch (error) {
                console.error('Ошибка обработки голосового ввода:', error);
                statusDiv.textContent = 'Ошибка: ' + error.message;
            }
        };
    }
}

// Обработчики событий
startButton.addEventListener("click", startSession);
stopButton.addEventListener("click", stopSession);
micButton.addEventListener("click", () => {
    if (recognition) {
        statusDiv.textContent = 'Говорите...';
        recognition.start();
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    statusDiv.textContent = 'Готов к запуску';
    initSpeechRecognition();
}); 