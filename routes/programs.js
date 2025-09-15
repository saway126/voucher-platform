const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 모든 사업 조회 (공개)
router.get('/', async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT p.*, u.name as created_by_name,
                   COUNT(a.id) as application_count
            FROM programs p
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN applications a ON p.id = a.program_id
        `;
        
        const conditions = [];
        const params = [];

        if (status) {
            conditions.push('p.status = ?');
            params.push(status);
        }

        if (type) {
            conditions.push('p.type = ?');
            params.push(type);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const programs = await database.all(sql, params);

        // 총 개수 조회
        let countSql = 'SELECT COUNT(*) as total FROM programs p';
        if (conditions.length > 0) {
            countSql += ' WHERE ' + conditions.join(' AND ');
        }
        const countResult = await database.get(countSql, params.slice(0, -2));
        const total = countResult.total;

        res.json({
            success: true,
            data: {
                programs: programs.map(program => ({
                    id: program.id,
                    title: program.title,
                    description: program.description,
                    type: program.type,
                    budget: program.budget,
                    maxApplicants: program.max_applicants,
                    applicationCount: program.application_count,
                    schedule: {
                        applicationStart: program.application_start,
                        applicationEnd: program.application_end,
                        reviewStart: program.review_start,
                        reviewEnd: program.review_end,
                        announcementDate: program.announcement_date
                    },
                    eligibilityCriteria: program.eligibility_criteria ? JSON.parse(program.eligibility_criteria) : null,
                    status: program.status,
                    createdBy: program.created_by_name,
                    createdAt: program.created_at,
                    updatedAt: program.updated_at
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
        console.error('사업 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 특정 사업 조회 (공개)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const program = await database.get(`
            SELECT p.*, u.name as created_by_name,
                   COUNT(a.id) as application_count
            FROM programs p
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN applications a ON p.id = a.program_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [id]);

        if (!program) {
            return res.status(404).json({
                success: false,
                message: '사업을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: {
                id: program.id,
                title: program.title,
                description: program.description,
                type: program.type,
                budget: program.budget,
                maxApplicants: program.max_applicants,
                applicationCount: program.application_count,
                schedule: {
                    applicationStart: program.application_start,
                    applicationEnd: program.application_end,
                    reviewStart: program.review_start,
                    reviewEnd: program.review_end,
                    announcementDate: program.announcement_date
                },
                eligibilityCriteria: program.eligibility_criteria ? JSON.parse(program.eligibility_criteria) : null,
                status: program.status,
                createdBy: program.created_by_name,
                createdAt: program.created_at,
                updatedAt: program.updated_at
            }
        });

    } catch (error) {
        console.error('사업 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 사업 생성 (관리자만)
router.post('/', [
    authMiddleware,
    requireAdmin,
    body('title').trim().isLength({ min: 1 }),
    body('description').trim().isLength({ min: 1 }),
    body('type').isIn(['announcement', 'competition', 'emergency']),
    body('budget').isInt({ min: 0 }),
    body('maxApplicants').optional().isInt({ min: 1 }),
    body('applicationStart').isISO8601(),
    body('applicationEnd').isISO8601(),
    body('reviewStart').optional().isISO8601(),
    body('reviewEnd').optional().isISO8601(),
    body('announcementDate').optional().isISO8601()
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

        const {
            title,
            description,
            type,
            budget,
            maxApplicants,
            applicationStart,
            applicationEnd,
            reviewStart,
            reviewEnd,
            announcementDate,
            eligibilityCriteria
        } = req.body;

        const result = await database.run(`
            INSERT INTO programs (
                title, description, type, budget, max_applicants,
                application_start, application_end, review_start, review_end, announcement_date,
                eligibility_criteria, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, description, type, budget, maxApplicants,
            applicationStart, applicationEnd, reviewStart, reviewEnd, announcementDate,
            JSON.stringify(eligibilityCriteria), 'draft', req.user.userId
        ]);

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'create_program', 'program', result.id, req.ip, req.get('User-Agent')]
        );

        res.status(201).json({
            success: true,
            message: '사업이 생성되었습니다.',
            data: { id: result.id }
        });

    } catch (error) {
        console.error('사업 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 사업 수정 (관리자만)
router.put('/:id', [
    authMiddleware,
    requireAdmin,
    body('title').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim().isLength({ min: 1 }),
    body('type').optional().isIn(['announcement', 'competition', 'emergency']),
    body('budget').optional().isInt({ min: 0 }),
    body('maxApplicants').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['draft', 'published', 'closed', 'completed'])
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
        const updateData = req.body;

        // 사업 존재 확인
        const existingProgram = await database.get(
            'SELECT id FROM programs WHERE id = ?',
            [id]
        );

        if (!existingProgram) {
            return res.status(404).json({
                success: false,
                message: '사업을 찾을 수 없습니다.'
            });
        }

        // 업데이트할 필드 구성
        const updateFields = [];
        const updateValues = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                updateFields.push(`${dbKey} = ?`);
                updateValues.push(updateData[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: '수정할 데이터가 없습니다.'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        await database.run(
            `UPDATE programs SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'update_program', 'program', id, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            message: '사업이 수정되었습니다.'
        });

    } catch (error) {
        console.error('사업 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 사업 삭제 (관리자만)
router.delete('/:id', [authMiddleware, requireAdmin], async (req, res) => {
    try {
        const { id } = req.params;

        // 사업 존재 확인
        const existingProgram = await database.get(
            'SELECT id FROM programs WHERE id = ?',
            [id]
        );

        if (!existingProgram) {
            return res.status(404).json({
                success: false,
                message: '사업을 찾을 수 없습니다.'
            });
        }

        // 관련 데이터 확인 (신청서가 있는지)
        const applicationCount = await database.get(
            'SELECT COUNT(*) as count FROM applications WHERE program_id = ?',
            [id]
        );

        if (applicationCount.count > 0) {
            return res.status(400).json({
                success: false,
                message: '신청서가 있는 사업은 삭제할 수 없습니다.'
            });
        }

        await database.run('DELETE FROM programs WHERE id = ?', [id]);

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'delete_program', 'program', id, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            message: '사업이 삭제되었습니다.'
        });

    } catch (error) {
        console.error('사업 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
