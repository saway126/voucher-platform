const express = require('express');
const database = require('../database/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 관리자 대시보드 통계
router.get('/dashboard', [authMiddleware, requireAdmin], async (req, res) => {
    try {
        // 기본 통계 조회
        const stats = await Promise.all([
            // 진행 중인 사업 수
            database.get('SELECT COUNT(*) as count FROM programs WHERE status = ?', ['published']),
            // 총 신청자 수
            database.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['applicant']),
            // 승인된 바우처 수
            database.get('SELECT COUNT(*) as count FROM vouchers WHERE status = ?', ['active']),
            // 사용된 바우처 수
            database.get('SELECT COUNT(*) as count FROM vouchers WHERE status = ?', ['used'])
        ]);

        // 최근 신청서 조회
        const recentApplications = await database.all(`
            SELECT a.id, a.application_number, a.status, a.created_at,
                   p.title as program_title, u.name as applicant_name
            FROM applications a
            JOIN programs p ON a.program_id = p.id
            JOIN users u ON a.applicant_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 10
        `);

        // 최근 바우처 발급 조회
        const recentVouchers = await database.all(`
            SELECT v.id, v.code, v.amount, v.balance, v.status, v.created_at,
                   p.title as program_title, u.name as applicant_name
            FROM vouchers v
            JOIN programs p ON v.program_id = p.id
            JOIN users u ON v.applicant_id = u.id
            ORDER BY v.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    activePrograms: stats[0].count,
                    totalApplicants: stats[1].count,
                    activeVouchers: stats[2].count,
                    usedVouchers: stats[3].count
                },
                recentApplications: recentApplications.map(app => ({
                    id: app.id,
                    applicationNumber: app.application_number,
                    programTitle: app.program_title,
                    applicantName: app.applicant_name,
                    status: app.status,
                    createdAt: app.created_at
                })),
                recentVouchers: recentVouchers.map(voucher => ({
                    id: voucher.id,
                    code: voucher.code,
                    amount: voucher.amount,
                    balance: voucher.balance,
                    programTitle: voucher.program_title,
                    applicantName: voucher.applicant_name,
                    status: voucher.status,
                    createdAt: voucher.created_at
                }))
            }
        });

    } catch (error) {
        console.error('대시보드 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 감사 로그 조회
router.get('/audit-logs', [authMiddleware, requireAdmin], async (req, res) => {
    try {
        const { page = 1, limit = 50, action, actorId } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT al.*, u.name as actor_name, u.email as actor_email
            FROM audit_logs al
            JOIN users u ON al.actor_id = u.id
        `;
        
        const conditions = [];
        const params = [];

        if (action) {
            conditions.push('al.action = ?');
            params.push(action);
        }

        if (actorId) {
            conditions.push('al.actor_id = ?');
            params.push(actorId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const logs = await database.all(sql, params);

        // 총 개수 조회
        let countSql = 'SELECT COUNT(*) as total FROM audit_logs al';
        if (conditions.length > 0) {
            countSql += ' WHERE ' + conditions.join(' AND ');
        }
        const countResult = await database.get(countSql, params.slice(0, -2));
        const total = countResult.total;

        res.json({
            success: true,
            data: {
                logs: logs.map(log => ({
                    id: log.id,
                    actorName: log.actor_name,
                    actorEmail: log.actor_email,
                    action: log.action,
                    targetType: log.target_type,
                    targetId: log.target_id,
                    details: log.details,
                    ipAddress: log.ip_address,
                    userAgent: log.user_agent,
                    createdAt: log.created_at
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
        console.error('감사 로그 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
