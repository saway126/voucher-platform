const express = require('express');
const router = express.Router();

// 문의하기 API
router.post('/contact', async (req, res) => {
    try {
        const { category, title, message, email, phone } = req.body;
        
        // 필수 필드 검증
        if (!category || !title || !message || !email) {
            return res.status(400).json({
                success: false,
                message: '필수 항목을 모두 입력해주세요.'
            });
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다.'
            });
        }
        
        // 문의 데이터 저장 (실제로는 데이터베이스에 저장)
        const contactData = {
            id: Date.now(),
            category,
            title,
            message,
            email,
            phone: phone || null,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('새로운 문의가 접수되었습니다:', contactData);
        
        res.json({
            success: true,
            message: '문의가 성공적으로 접수되었습니다.',
            data: {
                inquiryId: contactData.id,
                estimatedResponseTime: '1-2 영업일'
            }
        });
        
    } catch (error) {
        console.error('문의 접수 오류:', error);
        res.status(500).json({
            success: false,
            message: '문의 접수 중 오류가 발생했습니다.'
        });
    }
});

// FAQ 목록 조회
router.get('/faq', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        // 더미 FAQ 데이터
        const faqData = [
            {
                id: 1,
                category: 'account',
                question: '회원가입은 어떻게 하나요?',
                answer: '홈페이지 우측 상단의 "회원가입" 버튼을 클릭하여 이메일과 비밀번호를 입력하면 됩니다.',
                views: 1250,
                createdAt: '2024-01-01'
            },
            {
                id: 2,
                category: 'application',
                question: '바우처 신청은 언제까지 가능한가요?',
                answer: '각 바우처 사업마다 신청 기간이 다릅니다. 사업 상세 페이지에서 신청 기간을 확인하실 수 있습니다.',
                views: 980,
                createdAt: '2024-01-01'
            },
            {
                id: 3,
                category: 'voucher',
                question: '바우처는 어떻게 사용하나요?',
                answer: '마이페이지에서 발급받은 바우처를 확인하고, 바우처 사용 가능한 업체에서 서비스 이용 시 제시하면 됩니다.',
                views: 2100,
                createdAt: '2024-01-01'
            },
            {
                id: 4,
                category: 'payment',
                question: '바우처 사용 시 추가 결제가 필요한가요?',
                answer: '바우처 금액을 초과하는 부분에 대해서만 추가 결제가 필요합니다.',
                views: 750,
                createdAt: '2024-01-01'
            },
            {
                id: 5,
                category: 'account',
                question: '비밀번호를 잊어버렸어요.',
                answer: '로그인 페이지에서 "비밀번호 찾기"를 클릭하여 이메일로 재설정 링크를 받으실 수 있습니다.',
                views: 650,
                createdAt: '2024-01-01'
            },
            {
                id: 6,
                category: 'application',
                question: '신청 후 취소할 수 있나요?',
                answer: '심사 전까지는 신청 취소가 가능합니다. 마이페이지에서 신청 내역을 확인하고 취소할 수 있습니다.',
                views: 420,
                createdAt: '2024-01-01'
            }
        ];
        
        let filteredFAQ = faqData;
        
        // 카테고리 필터링
        if (category && category !== 'all') {
            filteredFAQ = filteredFAQ.filter(faq => faq.category === category);
        }
        
        // 검색 필터링
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredFAQ = filteredFAQ.filter(faq => 
                faq.question.toLowerCase().includes(searchTerm) ||
                faq.answer.toLowerCase().includes(searchTerm)
            );
        }
        
        res.json({
            success: true,
            data: filteredFAQ,
            total: filteredFAQ.length
        });
        
    } catch (error) {
        console.error('FAQ 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: 'FAQ 조회 중 오류가 발생했습니다.'
        });
    }
});

// 공지사항 목록 조회
router.get('/notices', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        // 더미 공지사항 데이터
        const noticesData = [
            {
                id: 1,
                title: '2024년 1분기 바우처 사업 안내',
                content: '2024년 1분기에 진행되는 새로운 바우처 사업들을 안내드립니다. 다양한 분야의 바우처 사업이 준비되어 있으니 많은 관심과 참여 부탁드립니다.',
                isImportant: true,
                views: 2500,
                createdAt: '2024-01-15',
                updatedAt: '2024-01-15'
            },
            {
                id: 2,
                title: '시스템 점검 안내',
                content: '더 나은 서비스 제공을 위해 시스템 점검을 진행합니다. 점검 시간 동안 서비스 이용이 제한될 수 있습니다.',
                isImportant: false,
                views: 1200,
                createdAt: '2024-01-10',
                updatedAt: '2024-01-10'
            },
            {
                id: 3,
                title: '바우처 사용 가이드 업데이트',
                content: '바우처 사용 방법이 업데이트되었습니다. 자세한 내용은 이용 가이드를 확인해주세요.',
                isImportant: false,
                views: 800,
                createdAt: '2024-01-05',
                updatedAt: '2024-01-05'
            },
            {
                id: 4,
                title: '개인정보 처리방침 변경 안내',
                content: '개인정보 처리방침이 변경되었습니다. 변경된 내용을 확인해주세요.',
                isImportant: true,
                views: 1500,
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01'
            }
        ];
        
        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedNotices = noticesData.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: paginatedNotices,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(noticesData.length / limit),
                totalItems: noticesData.length,
                itemsPerPage: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('공지사항 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 조회 중 오류가 발생했습니다.'
        });
    }
});

// 공지사항 상세 조회
router.get('/notices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 더미 공지사항 데이터에서 해당 ID 찾기
        const noticesData = [
            {
                id: 1,
                title: '2024년 1분기 바우처 사업 안내',
                content: '2024년 1분기에 진행되는 새로운 바우처 사업들을 안내드립니다. 다양한 분야의 바우처 사업이 준비되어 있으니 많은 관심과 참여 부탁드립니다.',
                isImportant: true,
                views: 2500,
                createdAt: '2024-01-15',
                updatedAt: '2024-01-15'
            }
            // ... 다른 공지사항들
        ];
        
        const notice = noticesData.find(n => n.id === parseInt(id));
        
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }
        
        // 조회수 증가
        notice.views += 1;
        
        res.json({
            success: true,
            data: notice
        });
        
    } catch (error) {
        console.error('공지사항 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 조회 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
