const jwt = require('jsonwebtoken');
const database = require('../database/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT 토큰 검증 미들웨어
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        // 토큰 검증
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 사용자 존재 확인
        const user = await database.get(
            'SELECT id, email, role, is_verified FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }

        // 요청 객체에 사용자 정보 추가
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.is_verified
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다.'
            });
        } else {
            console.error('인증 미들웨어 오류:', error);
            return res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    }
};

// 역할 기반 접근 제어 미들웨어
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다.'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다.'
            });
        }

        next();
    };
};

// 관리자 권한 확인
const requireAdmin = requireRole(['admin', 'super_admin']);

// 감사 권한 확인
const requireAudit = requireRole(['super_admin']);

// 이메일 인증 확인
const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '인증이 필요합니다.'
        });
    }

    if (!req.user.isVerified) {
        return res.status(403).json({
            success: false,
            message: '이메일 인증이 필요합니다.'
        });
    }

    next();
};

module.exports = {
    authMiddleware,
    requireRole,
    requireAdmin,
    requireAudit,
    requireVerified
};
