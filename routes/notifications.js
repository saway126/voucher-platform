const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 알림 발송
router.post('/send', [
    authMiddleware,
    requireAdmin,
    body('recipientId').isInt({ min: 1 }),
    body('channel').isIn(['email', 'sms', 'kakao']),
    body('template').trim().isLength({ min: 1 }),
    body('content').trim().isLength({ min: 1 })
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

        const { recipientId, channel, template, content } = req.body;

        // 수신자 존재 확인
        const recipient = await database.get(
            'SELECT id FROM users WHERE id = ?',
            [recipientId]
        );

        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: '수신자를 찾을 수 없습니다.'
            });
        }

        // 알림 생성
        const result = await database.run(`
            INSERT INTO notifications (recipient_id, channel, template, content, status)
            VALUES (?, ?, ?, ?, ?)
        `, [recipientId, channel, template, content, 'sent']);

        // 실제 발송 로직은 여기에 구현 (이메일, SMS, 카카오톡 API 연동)
        // 현재는 시뮬레이션
        console.log(`알림 발송: ${channel} - ${recipientId} - ${template}`);

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'send_notification', 'notification', result.id, req.ip, req.get('User-Agent')]
        );

        res.status(201).json({
            success: true,
            message: '알림이 발송되었습니다.',
            data: { notificationId: result.id }
        });

    } catch (error) {
        console.error('알림 발송 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 내 알림 목록 조회
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const recipientId = req.user.userId;

        const notifications = await database.all(`
            SELECT * FROM notifications 
            WHERE recipient_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [recipientId, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            data: {
                notifications: notifications.map(notification => ({
                    id: notification.id,
                    channel: notification.channel,
                    template: notification.template,
                    content: notification.content,
                    status: notification.status,
                    sentAt: notification.sent_at,
                    createdAt: notification.created_at
                }))
            }
        });

    } catch (error) {
        console.error('알림 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
