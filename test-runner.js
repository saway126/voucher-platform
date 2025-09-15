// 자동화된 테스트 스크립트
// 브라우저 콘솔에서 실행하여 기본 기능들을 자동으로 테스트합니다.

class TestRunner {
    constructor() {
        this.testResults = [];
        this.currentTest = 0;
    }

    // 테스트 실행
    async runAllTests() {
        console.log('🧪 바우처 사업 온라인 통합 플랫폼 테스트 시작...\n');
        
        const tests = [
            { name: '데이터 모델 초기화', fn: () => this.testDataModel() },
            { name: '사업 생성', fn: () => this.testProgramCreation() },
            { name: '신청자 생성', fn: () => this.testApplicantCreation() },
            { name: '신청서 제출', fn: () => this.testApplicationSubmission() },
            { name: '심사 프로세스', fn: () => this.testReviewProcess() },
            { name: '배분 시뮬레이션', fn: () => this.testAllocationSimulation() },
            { name: '바우처 발급', fn: () => this.testVoucherIssuance() },
            { name: '알림 시스템', fn: () => this.testNotificationSystem() },
            { name: '감사 로그', fn: () => this.testAuditLogs() },
            { name: 'UI 컴포넌트', fn: () => this.testUIComponents() }
        ];

        for (const test of tests) {
            await this.runTest(test.name, test.fn);
        }

        this.printResults();
    }

    // 개별 테스트 실행
    async runTest(testName, testFunction) {
        try {
            console.log(`⏳ ${testName} 테스트 중...`);
            const result = await testFunction();
            this.testResults.push({ name: testName, status: 'PASS', result });
            console.log(`✅ ${testName} 통과\n`);
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
            console.log(`❌ ${testName} 실패: ${error.message}\n`);
        }
    }

    // 데이터 모델 테스트
    testDataModel() {
        if (!window.dataModel) {
            throw new Error('데이터 모델이 초기화되지 않았습니다.');
        }

        const programs = window.dataModel.getPrograms();
        const applicants = window.dataModel.getApplicants();
        const applications = window.dataModel.getApplications();

        return {
            programs: programs.length,
            applicants: applicants.length,
            applications: applications.length
        };
    }

    // 사업 생성 테스트
    testProgramCreation() {
        const testProgram = {
            title: '테스트 바우처 사업',
            description: '자동화 테스트를 위한 바우처 사업입니다.',
            type: 'announcement',
            budget: 10000000,
            maxApplicants: 50,
            schedule: {
                applicationStart: '2024-01-01T00:00:00',
                applicationEnd: '2024-03-31T23:59:59',
                reviewStart: '2024-04-01T00:00:00',
                reviewEnd: '2024-04-30T23:59:59',
                announcementDate: '2024-05-15T00:00:00'
            },
            eligibility: {
                ageRange: { min: 18, max: 65 },
                regions: ['전국'],
                incomeCriteria: { max: 3000000 }
            },
            template: 'test',
            createdBy: 'test-admin'
        };

        const program = window.dataModel.createProgram(testProgram);
        
        if (!program || !program.id) {
            throw new Error('사업 생성에 실패했습니다.');
        }

        return { programId: program.id, title: program.title };
    }

    // 신청자 생성 테스트
    testApplicantCreation() {
        const testApplicant = {
            type: 'individual',
            name: '테스트 사용자',
            email: 'test@example.com',
            phone: '010-1234-5678',
            birthDate: '1990-01-01',
            gender: 'male',
            address: '서울특별시 강남구'
        };

        const applicant = window.dataModel.createApplicant(testApplicant);
        
        if (!applicant || !applicant.id) {
            throw new Error('신청자 생성에 실패했습니다.');
        }

        return { applicantId: applicant.id, name: applicant.name };
    }

    // 신청서 제출 테스트
    testApplicationSubmission() {
        const programs = window.dataModel.getPrograms();
        const applicants = window.dataModel.getApplicants();
        
        if (programs.length === 0 || applicants.length === 0) {
            throw new Error('테스트용 사업 또는 신청자가 없습니다.');
        }

        const applicationData = {
            applicantId: applicants[0].id,
            programId: programs[0].id,
            formId: null,
            data: {
                applicantName: applicants[0].name,
                phone: applicants[0].phone,
                email: applicants[0].email,
                voucherType: 'education',
                purpose: '자동화 테스트를 위한 신청입니다.'
            }
        };

        const application = window.dataModel.createApplication(applicationData);
        
        if (!application || !application.applicationNumber) {
            throw new Error('신청서 제출에 실패했습니다.');
        }

        return { 
            applicationId: application.id, 
            applicationNumber: application.applicationNumber 
        };
    }

    // 심사 프로세스 테스트
    testReviewProcess() {
        const applications = window.dataModel.getApplications();
        
        if (applications.length === 0) {
            throw new Error('심사할 신청서가 없습니다.');
        }

        const reviewData = {
            applicationId: applications[0].id,
            reviewerId: 'test-reviewer-001',
            round: 1,
            score: 85,
            comment: '자동화 테스트를 위한 심사입니다.',
            status: 'completed'
        };

        const review = window.dataModel.createReview(reviewData);
        
        if (!review || !review.id) {
            throw new Error('심사 생성에 실패했습니다.');
        }

        return { reviewId: review.id, score: review.score };
    }

    // 배분 시뮬레이션 테스트
    testAllocationSimulation() {
        const programs = window.dataModel.getPrograms();
        
        if (programs.length === 0) {
            throw new Error('배분할 사업이 없습니다.');
        }

        const rules = {
            sortBy: 'score',
            voucherAmount: 50000
        };

        const result = window.dataModel.simulateAllocation(programs[0].id, rules);
        
        if (!result || typeof result.totalApplicants !== 'number') {
            throw new Error('배분 시뮬레이션에 실패했습니다.');
        }

        return {
            totalApplicants: result.totalApplicants,
            eligibleApplicants: result.eligibleApplicants,
            selectedApplicants: result.selectedApplicants,
            allocatedBudget: result.allocatedBudget
        };
    }

    // 바우처 발급 테스트
    testVoucherIssuance() {
        const programs = window.dataModel.getPrograms();
        const applicants = window.dataModel.getApplicants();
        
        if (programs.length === 0 || applicants.length === 0) {
            throw new Error('바우처 발급을 위한 데이터가 없습니다.');
        }

        const voucherData = {
            programId: programs[0].id,
            applicantId: applicants[0].id,
            amount: 50000,
            expiryDate: '2024-12-31',
            usageLimit: 1,
            issuedBy: 'test-admin'
        };

        const voucher = window.dataModel.createVoucher(voucherData);
        
        if (!voucher || !voucher.code) {
            throw new Error('바우처 발급에 실패했습니다.');
        }

        return { 
            voucherId: voucher.id, 
            code: voucher.code, 
            amount: voucher.amount 
        };
    }

    // 알림 시스템 테스트
    testNotificationSystem() {
        const notificationData = {
            recipientId: 'test-user-001',
            channel: 'email',
            template: 'application_received',
            content: '테스트 알림입니다.',
            status: 'sent'
        };

        const notification = window.dataModel.createNotification(notificationData);
        
        if (!notification || !notification.id) {
            throw new Error('알림 생성에 실패했습니다.');
        }

        return { notificationId: notification.id, channel: notification.channel };
    }

    // 감사 로그 테스트
    testAuditLogs() {
        const auditLogs = window.dataModel.getAuditLogs();
        
        if (!Array.isArray(auditLogs)) {
            throw new Error('감사 로그를 가져올 수 없습니다.');
        }

        // 최근 로그 확인
        const recentLogs = auditLogs.slice(-5);
        
        return { 
            totalLogs: auditLogs.length, 
            recentLogs: recentLogs.length 
        };
    }

    // UI 컴포넌트 테스트
    testUIComponents() {
        // 실제 HTML 구조에 맞는 선택자들 사용
        const tests = [
            { name: '네비게이션', selector: 'nav a, .nav ul li a' },
            { name: '폼 요소', selector: 'form, .application-form, .login-form, .register-form' },
            { name: '모달 창', selector: '.modal, .login-modal, .register-modal, .admin-modal' },
            { name: '관리자 버튼', selector: '.btn-admin, button[onclick*="showAdminPanel"], button[onclick*="showAdminModal"]' },
            { name: '헤더', selector: '.header' },
            { name: '프로그램 그리드', selector: '.programs-grid' }
        ];

        const results = tests.map(test => {
            let elements = document.querySelectorAll(test.selector);
            
            // 관리자 버튼의 경우 텍스트 내용으로도 찾기
            if (test.name === '관리자 버튼' && elements.length === 0) {
                const allButtons = document.querySelectorAll('button');
                elements = Array.from(allButtons).filter(btn => 
                    btn.textContent.includes('관리자') || 
                    btn.className.includes('admin') ||
                    btn.onclick && btn.onclick.toString().includes('showAdmin')
                );
            }
            
            // display: none인 요소도 포함하여 존재 여부만 확인
            const found = elements.length > 0;
            
            // 디버깅을 위한 상세 정보
            if (!found) {
                console.log(`❌ ${test.name} 찾기 실패 - 선택자: ${test.selector}`);
            } else {
                console.log(`✅ ${test.name} 찾기 성공 - 개수: ${elements.length}`);
            }
            
            return {
                name: test.name,
                found: found,
                count: elements.length,
                visible: Array.from(elements).some(el => el.offsetParent !== null)
            };
        });

        const failedTests = results.filter(result => !result.found);
        
        if (failedTests.length > 0) {
            const failedNames = failedTests.map(test => test.name).join(', ');
            console.log('실패한 테스트 상세 정보:', failedTests);
            throw new Error(`다음 UI 컴포넌트를 찾을 수 없습니다: ${failedNames}`);
        }

        return { 
            totalTests: tests.length,
            passedTests: results.filter(r => r.found).length,
            results: results
        };
    }

    // 결과 출력
    printResults() {
        console.log('\n📊 테스트 결과 요약');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;
        
        console.log(`총 테스트: ${total}`);
        console.log(`✅ 통과: ${passed}`);
        console.log(`❌ 실패: ${failed}`);
        console.log(`성공률: ${((passed / total) * 100).toFixed(1)}%\n`);
        
        if (failed > 0) {
            console.log('❌ 실패한 테스트:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
            console.log('');
        }
        
        console.log('✅ 통과한 테스트:');
        this.testResults
            .filter(r => r.status === 'PASS')
            .forEach(r => console.log(`  - ${r.name}`));
        
        console.log('\n🎉 테스트 완료!');
        
        if (passed === total) {
            console.log('🎊 모든 테스트가 통과했습니다! 플랫폼이 정상적으로 작동합니다.');
        } else {
            console.log('⚠️ 일부 테스트가 실패했습니다. 위의 실패 목록을 확인해주세요.');
        }
    }
}

// 테스트 실행 함수
function runTests() {
    const testRunner = new TestRunner();
    testRunner.runAllTests();
}

// 브라우저 콘솔에서 실행할 수 있도록 전역 함수로 등록
window.runTests = runTests;

console.log('🧪 테스트 스크립트가 로드되었습니다.');
console.log('테스트를 실행하려면 콘솔에서 "runTests()"를 입력하세요.');
