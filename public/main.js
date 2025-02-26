let avatar = null;
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

async function startSession() {
    try {
        const response = await fetch('/api/get-token');
        const data = await response.json();
        
        avatar = new StreamingAvatar({ token: data.data.token });
        
        const sessionData = await avatar.createStartAvatar({
            quality: "high",
            avatar_id: "Dexter_Doctor_Standing2_public"
        });

        avatar.on('STREAM_READY', (event) => {
            const videoElement = document.getElementById('avatarVideo');
            videoElement.srcObject = event.detail;
        });

        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        document.getElementById('micButton').disabled = false;
    } catch (error) {
        console.error('Ошибка запуска сессии:', error);
    }
}

async function stopSession() {
    if (avatar) {
        await avatar.stopAvatar();
        document.getElementById('avatarVideo').srcObject = null;
        document.getElementById('startButton').disabled = false;
        document.getElementById('stopButton').disabled = true;
        document.getElementById('micButton').disabled = true;
    }
}

document.getElementById('startButton').addEventListener('click', startSession);
document.getElementById('stopButton').addEventListener('click', stopSession);
document.getElementById('micButton').addEventListener('click', () => {
    if (recognition) {
        recognition.start();
    }
});

initSpeechRecognition(); 