const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 회원가입
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone('ko-KR'),
    body('type').isIn(['individual', 'organization'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터가 올바르지 않습니다.',
                errors: errors.array()
            });
        }

        const { email, password, name, phone, type, birthDate, gender, address } = req.body;

        // 이메일 중복 확인
        const existingUser = await database.get(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '이미 등록된 이메일입니다.'
            });
        }

        // 비밀번호 해시화
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 사용자 생성
        const result = await database.run(
            `INSERT INTO users (email, password_hash, name, phone, type, birth_date, gender, address, role)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, passwordHash, name, phone, type, birthDate, gender, address, 'applicant']
        );

        // JWT 토큰 생성
        const token = jwt.sign(
            { 
                userId: result.id, 
                email: email, 
                role: 'applicant' 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [result.id, 'register', 'user', result.id, req.ip, req.get('User-Agent')]
        );

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            data: {
                user: {
                    id: result.id,
                    email: email,
                    name: name,
                    type: type,
                    role: 'applicant'
                },
                token: token
            }
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 로그인
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터가 올바르지 않습니다.',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // 사용자 조회
        const user = await database.get(
            'SELECT id, email, password_hash, name, type, role, is_verified FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, 'login', 'user', user.id, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            message: '로그인되었습니다.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    type: user.type,
                    role: user.role,
                    isVerified: user.is_verified
                },
                token: token
            }
        });

    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 토큰 검증
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        const user = await database.get(
            'SELECT id, email, name, type, role, is_verified FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    type: user.type,
                    role: user.role,
                    isVerified: user.is_verified
                }
            }
        });

    } catch (error) {
        console.error('토큰 검증 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 비밀번호 변경
router.post('/change-password', [
    authMiddleware,
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '입력 데이터가 올바르지 않습니다.',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        // 현재 사용자 조회
        const user = await database.get(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 현재 비밀번호 확인
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '현재 비밀번호가 올바르지 않습니다.'
            });
        }

        // 새 비밀번호 해시화
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // 비밀번호 업데이트
        await database.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, userId]
        );

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, 'change_password', 'user', userId, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            message: '비밀번호가 변경되었습니다.'
        });

    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 로그아웃 (클라이언트 측에서 토큰 삭제)
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'logout', 'user', req.user.userId, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            message: '로그아웃되었습니다.'
        });

    } catch (error) {
        console.error('로그아웃 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
