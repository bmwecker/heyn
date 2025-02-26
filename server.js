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

// Маршрут для получения токена HeyGen
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
    console.log('Token response:', data);
    
    if (!data.data || !data.data.token) {
      console.error('Invalid token response:', data);
      return res.status(500).json({ error: 'Неверный формат ответа от HeyGen API' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ error: 'Ошибка получения токена' });
  }
});

// Маршрут для обработки запросов к n8n
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