const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.json({ message: '바우처 플랫폼 서버가 실행 중입니다!', status: 'success' });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'API가 정상적으로 작동합니다!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 테스트 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📱 접속 URL: http://localhost:${PORT}`);
});
