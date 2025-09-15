const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 신청자 목록 조회 (관리자만)
router.get('/', [authMiddleware, requireAdmin], async (req, res) => {
    try {
        const { page = 1, limit = 10, type, search } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT u.id, u.email, u.name, u.phone, u.type, u.birth_date, u.gender, u.address,
                   u.role, u.is_verified, u.created_at,
                   COUNT(a.id) as application_count
            FROM users u
            LEFT JOIN applications a ON u.id = a.applicant_id
        `;
        
        const conditions = ['u.role = ?'];
        const params = ['applicant'];

        if (type) {
            conditions.push('u.type = ?');
            params.push(type);
        }

        if (search) {
            conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' WHERE ' + conditions.join(' AND ');
        sql += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const applicants = await database.all(sql, params);

        // 총 개수 조회
        let countSql = 'SELECT COUNT(*) as total FROM users u WHERE u.role = ?';
        const countParams = ['applicant'];
        if (type) {
            countSql += ' AND u.type = ?';
            countParams.push(type);
        }
        if (search) {
            countSql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }
        const countResult = await database.get(countSql, countParams);
        const total = countResult.total;

        res.json({
            success: true,
            data: {
                applicants: applicants.map(applicant => ({
                    id: applicant.id,
                    email: applicant.email,
                    name: applicant.name,
                    phone: applicant.phone,
                    type: applicant.type,
                    birthDate: applicant.birth_date,
                    gender: applicant.gender,
                    address: applicant.address,
                    role: applicant.role,
                    isVerified: applicant.is_verified,
                    applicationCount: applicant.application_count,
                    createdAt: applicant.created_at
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('신청자 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 특정 신청자 조회 (관리자만)
router.get('/:id', [authMiddleware, requireAdmin], async (req, res) => {
    try {
        const { id } = req.params;

        const applicant = await database.get(`
            SELECT u.*, COUNT(a.id) as application_count
            FROM users u
            LEFT JOIN applications a ON u.id = a.applicant_id
            WHERE u.id = ? AND u.role = 'applicant'
            GROUP BY u.id
        `, [id]);

        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: '신청자를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: {
                id: applicant.id,
                email: applicant.email,
                name: applicant.name,
                phone: applicant.phone,
                type: applicant.type,
                birthDate: applicant.birth_date,
                gender: applicant.gender,
                address: applicant.address,
                role: applicant.role,
                isVerified: applicant.is_verified,
                applicationCount: applicant.application_count,
                createdAt: applicant.created_at,
                updatedAt: applicant.updated_at
            }
        });

    } catch (error) {
        console.error('신청자 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
