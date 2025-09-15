const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 배분 시뮬레이션
router.post('/simulate', [
    authMiddleware,
    requireAdmin,
    body('programId').isInt({ min: 1 }),
    body('rules').isObject()
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

        const { programId, rules } = req.body;

        // 사업 존재 확인
        const program = await database.get(
            'SELECT id, budget FROM programs WHERE id = ?',
            [programId]
        );

        if (!program) {
            return res.status(404).json({
                success: false,
                message: '사업을 찾을 수 없습니다.'
            });
        }

        // 신청서 조회 (심사 완료된 것만)
        const applications = await database.all(`
            SELECT a.id, a.applicant_id, a.score, u.name as applicant_name
            FROM applications a
            JOIN users u ON a.applicant_id = u.id
            WHERE a.program_id = ? AND a.status = 'approved'
            ORDER BY a.score DESC
        `, [programId]);

        // 배분 로직 실행
        const allocationResult = simulateAllocation(applications, program.budget, rules);

        // 배분 결과 저장
        const result = await database.run(`
            INSERT INTO allocations (program_id, allocation_rules, allocation_result, status)
            VALUES (?, ?, ?, ?)
        `, [programId, JSON.stringify(rules), JSON.stringify(allocationResult), 'draft']);

        res.json({
            success: true,
            message: '배분 시뮬레이션이 완료되었습니다.',
            data: {
                allocationId: result.id,
                result: allocationResult
            }
        });

    } catch (error) {
        console.error('배분 시뮬레이션 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 배분 확정
router.post('/:id/confirm', [authMiddleware, requireAdmin], async (req, res) => {
    try {
        const { id } = req.params;

        // 배분 존재 확인
        const allocation = await database.get(
            'SELECT id FROM allocations WHERE id = ?',
            [id]
        );

        if (!allocation) {
            return res.status(404).json({
                success: false,
                message: '배분을 찾을 수 없습니다.'
            });
        }

        // 배분 확정
        await database.run(
            'UPDATE allocations SET status = ?, confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['confirmed', req.user.userId, id]
        );

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'confirm_allocation', 'allocation', id, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            message: '배분이 확정되었습니다.'
        });

    } catch (error) {
        console.error('배분 확정 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 배분 시뮬레이션 로직
function simulateAllocation(applications, totalBudget, rules) {
    const { voucherAmount = 50000, maxRecipients } = rules;
    
    let selectedApplicants = [];
    let allocatedBudget = 0;
    let remainingBudget = totalBudget;

    // 점수 순으로 정렬 (이미 정렬됨)
    for (const application of applications) {
        if (maxRecipients && selectedApplicants.length >= maxRecipients) {
            break;
        }

        if (remainingBudget >= voucherAmount) {
            selectedApplicants.push({
                applicationId: application.id,
                applicantId: application.applicant_id,
                applicantName: application.applicant_name,
                score: application.score,
                voucherAmount: voucherAmount
            });

            allocatedBudget += voucherAmount;
            remainingBudget -= voucherAmount;
        }
    }

    return {
        totalApplicants: applications.length,
        eligibleApplicants: applications.length,
        selectedApplicants: selectedApplicants.length,
        allocatedBudget: allocatedBudget,
        remainingBudget: remainingBudget,
        voucherAmount: voucherAmount,
        recipients: selectedApplicants
    };
}

module.exports = router;
