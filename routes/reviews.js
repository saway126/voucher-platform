const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// 심사 제출
router.post('/', [
    authMiddleware,
    requireRole(['reviewer', 'admin', 'super_admin']),
    body('applicationId').isInt({ min: 1 }),
    body('score').isFloat({ min: 0, max: 100 }),
    body('comment').optional().trim(),
    body('round').optional().isInt({ min: 1 })
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

        const { applicationId, score, comment, round = 1 } = req.body;
        const reviewerId = req.user.userId;

        // 신청서 존재 확인
        const application = await database.get(
            'SELECT id FROM applications WHERE id = ?',
            [applicationId]
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: '신청서를 찾을 수 없습니다.'
            });
        }

        // 중복 심사 확인
        const existingReview = await database.get(
            'SELECT id FROM reviews WHERE application_id = ? AND reviewer_id = ? AND round = ?',
            [applicationId, reviewerId, round]
        );

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: '이미 해당 라운드에 심사를 완료했습니다.'
            });
        }

        // 심사 생성
        const result = await database.run(`
            INSERT INTO reviews (application_id, reviewer_id, round, score, comment, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [applicationId, reviewerId, round, score, comment, 'completed']);

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [reviewerId, 'submit_review', 'review', result.id, req.ip, req.get('User-Agent')]
        );

        res.status(201).json({
            success: true,
            message: '심사가 제출되었습니다.',
            data: { reviewId: result.id }
        });

    } catch (error) {
        console.error('심사 제출 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 내 심사 목록 조회
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        const reviewerId = req.user.userId;

        let sql = `
            SELECT r.*, a.application_number, p.title as program_title,
                   u.name as applicant_name
            FROM reviews r
            JOIN applications a ON r.application_id = a.id
            JOIN programs p ON a.program_id = p.id
            JOIN users u ON a.applicant_id = u.id
            WHERE r.reviewer_id = ?
        `;
        
        const params = [reviewerId];

        if (status) {
            sql += ' AND r.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const reviews = await database.all(sql, params);

        res.json({
            success: true,
            data: {
                reviews: reviews.map(review => ({
                    id: review.id,
                    applicationNumber: review.application_number,
                    programTitle: review.program_title,
                    applicantName: review.applicant_name,
                    round: review.round,
                    score: review.score,
                    comment: review.comment,
                    status: review.status,
                    createdAt: review.created_at,
                    updatedAt: review.updated_at
                }))
            }
        });

    } catch (error) {
        console.error('심사 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
