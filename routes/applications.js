const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authMiddleware, requireAdmin, requireVerified } = require('../middleware/auth');

const router = express.Router();

// 신청서 제출
router.post('/', [
    authMiddleware,
    requireVerified,
    body('programId').isInt({ min: 1 }),
    body('formData').isObject()
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

        const { programId, formData } = req.body;
        const applicantId = req.user.userId;

        // 사업 존재 및 신청 가능 여부 확인
        const program = await database.get(
            'SELECT id, status, application_start, application_end FROM programs WHERE id = ?',
            [programId]
        );

        if (!program) {
            return res.status(404).json({
                success: false,
                message: '사업을 찾을 수 없습니다.'
            });
        }

        if (program.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: '현재 신청을 받지 않는 사업입니다.'
            });
        }

        const now = new Date();
        const applicationStart = new Date(program.application_start);
        const applicationEnd = new Date(program.application_end);

        if (now < applicationStart || now > applicationEnd) {
            return res.status(400).json({
                success: false,
                message: '신청 기간이 아닙니다.'
            });
        }

        // 중복 신청 확인
        const existingApplication = await database.get(
            'SELECT id FROM applications WHERE applicant_id = ? AND program_id = ?',
            [applicantId, programId]
        );

        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: '이미 신청한 사업입니다.'
            });
        }

        // 접수번호 생성
        const applicationNumber = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // 신청서 생성
        const result = await database.run(`
            INSERT INTO applications (application_number, applicant_id, program_id, form_data, status)
            VALUES (?, ?, ?, ?, ?)
        `, [applicationNumber, applicantId, programId, JSON.stringify(formData), 'submitted']);

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [applicantId, 'submit_application', 'application', result.id, req.ip, req.get('User-Agent')]
        );

        res.status(201).json({
            success: true,
            message: '신청서가 제출되었습니다.',
            data: {
                applicationId: result.id,
                applicationNumber: applicationNumber
            }
        });

    } catch (error) {
        console.error('신청서 제출 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 내 신청서 목록 조회
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        const applicantId = req.user.userId;

        let sql = `
            SELECT a.*, p.title as program_title, p.type as program_type, p.status as program_status
            FROM applications a
            JOIN programs p ON a.program_id = p.id
            WHERE a.applicant_id = ?
        `;
        
        const params = [applicantId];

        if (status) {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const applications = await database.all(sql, params);

        // 총 개수 조회
        let countSql = 'SELECT COUNT(*) as total FROM applications a WHERE a.applicant_id = ?';
        const countParams = [applicantId];
        if (status) {
            countSql += ' AND a.status = ?';
            countParams.push(status);
        }
        const countResult = await database.get(countSql, countParams);
        const total = countResult.total;

        res.json({
            success: true,
            data: {
                applications: applications.map(app => ({
                    id: app.id,
                    applicationNumber: app.application_number,
                    programTitle: app.program_title,
                    programType: app.program_type,
                    programStatus: app.program_status,
                    status: app.status,
                    score: app.score,
                    notes: app.notes,
                    formData: JSON.parse(app.form_data),
                    createdAt: app.created_at,
                    updatedAt: app.updated_at
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
        console.error('신청서 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 특정 신청서 조회
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        let sql = `
            SELECT a.*, p.title as program_title, p.type as program_type, p.status as program_status,
                   u.name as applicant_name, u.email as applicant_email
            FROM applications a
            JOIN programs p ON a.program_id = p.id
            JOIN users u ON a.applicant_id = u.id
            WHERE a.id = ?
        `;

        const params = [id];

        // 일반 사용자는 자신의 신청서만 조회 가능
        if (userRole === 'applicant') {
            sql += ' AND a.applicant_id = ?';
            params.push(userId);
        }

        const application = await database.get(sql, params);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: '신청서를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: {
                id: application.id,
                applicationNumber: application.application_number,
                programTitle: application.program_title,
                programType: application.program_type,
                programStatus: application.program_status,
                applicantName: application.applicant_name,
                applicantEmail: application.applicant_email,
                status: application.status,
                score: application.score,
                notes: application.notes,
                formData: JSON.parse(application.form_data),
                createdAt: application.created_at,
                updatedAt: application.updated_at
            }
        });

    } catch (error) {
        console.error('신청서 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 모든 신청서 조회 (관리자만)
router.get('/', [authMiddleware, requireAdmin], async (req, res) => {
    try {
        const { page = 1, limit = 10, programId, status, applicantId } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT a.*, p.title as program_title, p.type as program_type,
                   u.name as applicant_name, u.email as applicant_email
            FROM applications a
            JOIN programs p ON a.program_id = p.id
            JOIN users u ON a.applicant_id = u.id
        `;
        
        const conditions = [];
        const params = [];

        if (programId) {
            conditions.push('a.program_id = ?');
            params.push(programId);
        }

        if (status) {
            conditions.push('a.status = ?');
            params.push(status);
        }

        if (applicantId) {
            conditions.push('a.applicant_id = ?');
            params.push(applicantId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const applications = await database.all(sql, params);

        // 총 개수 조회
        let countSql = `
            SELECT COUNT(*) as total FROM applications a
            JOIN programs p ON a.program_id = p.id
            JOIN users u ON a.applicant_id = u.id
        `;
        if (conditions.length > 0) {
            countSql += ' WHERE ' + conditions.join(' AND ');
        }
        const countResult = await database.get(countSql, params.slice(0, -2));
        const total = countResult.total;

        res.json({
            success: true,
            data: {
                applications: applications.map(app => ({
                    id: app.id,
                    applicationNumber: app.application_number,
                    programTitle: app.program_title,
                    programType: app.program_type,
                    applicantName: app.applicant_name,
                    applicantEmail: app.applicant_email,
                    status: app.status,
                    score: app.score,
                    notes: app.notes,
                    createdAt: app.created_at,
                    updatedAt: app.updated_at
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
        console.error('신청서 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 신청서 상태 변경 (관리자만)
router.put('/:id/status', [
    authMiddleware,
    requireAdmin,
    body('status').isIn(['submitted', 'under_review', 'approved', 'rejected', 'completed']),
    body('notes').optional().trim()
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
        const { status, notes } = req.body;

        // 신청서 존재 확인
        const existingApplication = await database.get(
            'SELECT id FROM applications WHERE id = ?',
            [id]
        );

        if (!existingApplication) {
            return res.status(404).json({
                success: false,
                message: '신청서를 찾을 수 없습니다.'
            });
        }

        // 상태 업데이트
        await database.run(
            'UPDATE applications SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, notes, id]
        );

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'update_application_status', 'application', id, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            message: '신청서 상태가 변경되었습니다.'
        });

    } catch (error) {
        console.error('신청서 상태 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
