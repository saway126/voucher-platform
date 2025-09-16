const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: ['http://localhost:8000', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 1000, // 최대 1000 요청 (테스트를 위해 증가)
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// 정적 파일 서빙
app.use(express.static(path.join(__dirname)));

// API 라우트
app.use('/api/auth', require('./routes/auth'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/applicants', require('./routes/applicants'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/files', require('./routes/files'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/support', require('./routes/support'));

// 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/programs', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/programs/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'program-detail.html'));
});

app.get('/apply', (req, res) => {
    res.sendFile(path.join(__dirname, 'apply.html'));
});

app.get('/mypage', (req, res) => {
    res.sendFile(path.join(__dirname, 'mypage.html'));
});

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, 'support.html'));
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.'
    });
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 바우처 플랫폼 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📱 접속 URL: http://localhost:${PORT}`);
    console.log(`🔧 환경: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
