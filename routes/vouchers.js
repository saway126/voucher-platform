const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 바우처 발급
router.post('/', [
    authMiddleware,
    requireAdmin,
    body('programId').isInt({ min: 1 }),
    body('applicantId').isInt({ min: 1 }),
    body('amount').isInt({ min: 1 }),
    body('expiryDate').optional().isISO8601(),
    body('usageLimit').optional().isInt({ min: 1 })
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

        const { programId, applicantId, amount, expiryDate, usageLimit = 1 } = req.body;

        // 사업 및 신청자 존재 확인
        const program = await database.get('SELECT id FROM programs WHERE id = ?', [programId]);
        const applicant = await database.get('SELECT id FROM users WHERE id = ?', [applicantId]);

        if (!program || !applicant) {
            return res.status(404).json({
                success: false,
                message: '사업 또는 신청자를 찾을 수 없습니다.'
            });
        }

        // 바우처 코드 생성
        const voucherCode = `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // 바우처 생성
        const result = await database.run(`
            INSERT INTO vouchers (code, program_id, applicant_id, amount, balance, expiry_date, usage_limit, issued_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [voucherCode, programId, applicantId, amount, amount, expiryDate, usageLimit, req.user.userId]);

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'issue_voucher', 'voucher', result.id, req.ip, req.get('User-Agent')]
        );

        res.status(201).json({
            success: true,
            message: '바우처가 발급되었습니다.',
            data: {
                voucherId: result.id,
                code: voucherCode,
                amount: amount
            }
        });

    } catch (error) {
        console.error('바우처 발급 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 내 바우처 목록 조회
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        const applicantId = req.user.userId;

        let sql = `
            SELECT v.*, p.title as program_title
            FROM vouchers v
            JOIN programs p ON v.program_id = p.id
            WHERE v.applicant_id = ?
        `;
        
        const params = [applicantId];

        if (status) {
            sql += ' AND v.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const vouchers = await database.all(sql, params);

        res.json({
            success: true,
            data: {
                vouchers: vouchers.map(voucher => ({
                    id: voucher.id,
                    code: voucher.code,
                    programTitle: voucher.program_title,
                    amount: voucher.amount,
                    balance: voucher.balance,
                    expiryDate: voucher.expiry_date,
                    usageLimit: voucher.usage_limit,
                    status: voucher.status,
                    createdAt: voucher.created_at,
                    updatedAt: voucher.updated_at
                }))
            }
        });

    } catch (error) {
        console.error('바우처 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 바우처 사용
router.post('/:id/use', [
    authMiddleware,
    body('amount').isInt({ min: 1 }),
    body('merchantName').optional().trim()
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

        const { id } = req.params;
        const { amount, merchantName } = req.body;
        const userId = req.user.userId;

        // 바우처 조회
        const voucher = await database.get(
            'SELECT * FROM vouchers WHERE id = ? AND applicant_id = ?',
            [id, userId]
        );

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: '바우처를 찾을 수 없습니다.'
            });
        }

        if (voucher.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: '사용할 수 없는 바우처입니다.'
            });
        }

        if (voucher.balance < amount) {
            return res.status(400).json({
                success: false,
                message: '잔액이 부족합니다.'
            });
        }

        // 바우처 사용 처리
        const newBalance = voucher.balance - amount;
        const newStatus = newBalance <= 0 ? 'used' : 'active';

        await database.run(
            'UPDATE vouchers SET balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newBalance, newStatus, id]
        );

        // 사용 내역 기록
        await database.run(`
            INSERT INTO voucher_usage (voucher_id, amount, merchant_name)
            VALUES (?, ?, ?)
        `, [id, amount, merchantName]);

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, 'use_voucher', 'voucher', id, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            message: '바우처가 사용되었습니다.',
            data: {
                remainingBalance: newBalance,
                status: newStatus
            }
        });

    } catch (error) {
        console.error('바우처 사용 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
