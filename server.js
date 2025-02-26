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

// Создание новой сессии
app.post('/api/create-session', async (req, res) => {
    try {
        const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_CONFIG.apiKey
            },
            body: JSON.stringify({
                version: "v2",
                avatar_id: "Dexter_Doctor_Standing2_public"
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Ошибка создания сессии:', error);
        res.status(500).json({ error: 'Ошибка создания сессии' });
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
                session_id: req.body.sessionId
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Ошибка запуска сессии:', error);
        res.status(500).json({ error: 'Ошибка запуска сессии' });
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
}); 