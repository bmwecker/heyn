// DOM elements
const videoElement = document.getElementById("avatarVideo");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const micButton = document.getElementById("micButton");

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
        console.log('Starting session...');
        
        // Проверяем доступность SDK
        if (typeof StreamingAvatar === 'undefined') {
            throw new Error('SDK не загружен');
        }

        const token = await fetchAccessToken();
        console.log('Got token:', token);

        // Создаем экземпляр аватара
        avatar = new StreamingAvatar({ token });
        console.log('Avatar instance created:', avatar);

        // Запускаем сессию
        sessionData = await avatar.createStartAvatar({
            quality: "high",
            avatar_id: "Dexter_Doctor_Standing2_public",
            voice: {
                voice_id: "81bb7c1a521442f6b812b2294a29acc1"
            }
        });

        console.log("Session data:", sessionData);

        // Обработчик готовности потока
        avatar.on('STREAM_READY', (event) => {
            console.log('Stream ready:', event);
            if (event.detail) {
                videoElement.srcObject = event.detail;
                videoElement.play().catch(console.error);
            }
        });

        // Обработчик отключения
        avatar.on('STREAM_DISCONNECTED', () => {
            console.log('Stream disconnected');
            videoElement.srcObject = null;
            startButton.disabled = false;
            stopButton.disabled = true;
            micButton.disabled = true;
        });

        // Обработчик ошибок
        avatar.on('error', (error) => {
            console.error('Avatar error:', error);
        });

        // Обновляем состояние кнопок
        stopButton.disabled = false;
        startButton.disabled = true;
        micButton.disabled = false;

    } catch (error) {
        console.error('Ошибка запуска сессии:', error);
        alert('Не удалось запустить сессию: ' + error.message);
    }
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
    } catch (error) {
        console.error('Ошибка остановки сессии:', error);
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
                if (data.response && avatar) {
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
    console.log('SDK Status:', typeof StreamingAvatar);
    initSpeechRecognition();
}); 