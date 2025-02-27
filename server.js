import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const API_CONFIG = {
    serverUrl: "https://api.heygen.com",
    apiKey: process.env.HEYGEN_API_KEY
};

// Настройка CORS для всех доменов
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Origin, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Content-Type-Options');
  
  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'));

// Создание новой сессии
app.post('/api/create-session', async (req, res) => {
    try {
        // Сначала получаем токен
        const tokenResponse = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.create_token`, {
            method: 'POST',
            headers: {
                'x-api-key': API_CONFIG.apiKey,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token response error:', errorText);
            throw new Error('Ошибка получения токена');
        }

        const tokenData = await tokenResponse.json();
        console.log('Token response:', tokenData);
        
        if (!tokenData.data || !tokenData.data.token) {
            throw new Error('Неверный формат токена');
        }

        // Затем создаем сессию
        const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "x-api-key": API_CONFIG.apiKey,
                "Authorization": `Bearer ${tokenData.data.token}`
            },
            body: JSON.stringify({
                quality: "high",
                avatar_id: "Dexter_Doctor_Standing2_public",
                voice: {
                    voice_id: "81bb7c1a521442f6b812b2294a29acc1"
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Session response error:', errorText);
            throw new Error('Ошибка создания сессии');
        }

        const data = await response.json();
        console.log('Session response:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        res.json(data);
    } catch (error) {
        console.error('Ошибка создания сессии:', error);
        res.status(500).json({ error: 'Ошибка создания сессии: ' + error.message });
    }
});

// Запуск сессии
app.post('/api/start-session', async (req, res) => {
    try {
        const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_CONFIG.apiKey
            },
            body: JSON.stringify({
                session_id: req.body.sessionId,
                sdp: req.body.sdp
            })
        });
        
        const data = await response.json();
        console.log('Start session response:', data);
        
        if (!data.sdp) {
            throw new Error('No SDP in response');
        }
        
        res.json(data);
    } catch (error) {
        console.error('Ошибка запуска сессии:', error);
        res.status(500).json({ error: 'Ошибка запуска сессии: ' + error.message });
    }
});

// Отправка текста
app.post('/api/send-text', async (req, res) => {
    try {
        const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.task`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_CONFIG.apiKey
            },
            body: JSON.stringify({
                session_id: req.body.sessionId,
                text: req.body.text,
                task_type: "talk"
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Ошибка отправки текста:', error);
        res.status(500).json({ error: 'Ошибка отправки текста' });
    }
});

// Остановка сессии
app.post('/api/stop-session', async (req, res) => {
    try {
        const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.stop`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_CONFIG.apiKey
            },
            body: JSON.stringify({
                session_id: req.body.sessionId
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Ошибка остановки сессии:', error);
        res.status(500).json({ error: 'Ошибка остановки сессии' });
    }
});

app.get('/api/get-token', async (req, res) => {
    try {
        const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.HEYGEN_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Token error:', error);
        res.status(500).json({ error: 'Ошибка получения токена' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch('https://shlomonm.app.n8n.cloud/webhook-test/2afff6a8-4194-4a79-bcb0-73c9dd4dc18b', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обработки запроса' });
    }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
}); 