// 바우처 사업 온라인 통합 플랫폼 데이터 모델
// 기획안 v1.0 기반 설계

class DataModel {
    constructor() {
        this.initializeStorage();
    }

    // 로컬 스토리지 초기화
    initializeStorage() {
        const defaultData = {
            programs: [],
            forms: [],
            applications: [],
            applicants: [],
            reviews: [],
            allocations: [],
            vouchers: [],
            payouts: [],
            reports: [],
            notifications: [],
            files: [],
            auditLogs: [],
            users: [],
            roles: this.getDefaultRoles()
        };

        Object.keys(defaultData).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(defaultData[key]));
            }
        });
    }

    // 기본 역할 정의 (RBAC)
    getDefaultRoles() {
        return [
            { id: 'applicant', name: '신청자', level: 1, permissions: ['read_own', 'create_application', 'update_own'] },
            { id: 'reviewer', name: '심사위원', level: 2, permissions: ['read_assigned', 'create_review', 'update_review'] },
            { id: 'partner', name: '협력기관', level: 3, permissions: ['read_partner', 'view_dashboard'] },
            { id: 'admin', name: '운영관리자', level: 4, permissions: ['read_all', 'create_program', 'manage_forms', 'manage_allocations'] },
            { id: 'super_admin', name: '감사/감독', level: 5, permissions: ['audit_logs', 'system_config', 'user_management'] }
        ];
    }

    // === Programs (사업) 관리 ===
    createProgram(programData) {
        const programs = this.getPrograms();
        const newProgram = {
            id: this.generateId(),
            title: programData.title,
            description: programData.description,
            status: 'draft', // draft, published, closed, completed
            type: programData.type, // 공고형, 공모형, 긴급지원형
            budget: programData.budget,
            maxApplicants: programData.maxApplicants,
            schedule: {
                applicationStart: programData.applicationStart,
                applicationEnd: programData.applicationEnd,
                reviewStart: programData.reviewStart,
                reviewEnd: programData.reviewEnd,
                announcementDate: programData.announcementDate
            },
            eligibility: programData.eligibility,
            template: programData.template,
            createdAt: new Date().toISOString(),
            createdBy: programData.createdBy,
            updatedAt: new Date().toISOString()
        };

        programs.push(newProgram);
        this.savePrograms(programs);
        this.logAudit('create', 'program', newProgram.id, programData.createdBy);
        return newProgram;
    }

    getPrograms() {
        return JSON.parse(localStorage.getItem('programs') || '[]');
    }

    getProgram(id) {
        const programs = this.getPrograms();
        return programs.find(p => p.id === id);
    }

    updateProgram(id, updateData) {
        const programs = this.getPrograms();
        const index = programs.findIndex(p => p.id === id);
        if (index !== -1) {
            programs[index] = { ...programs[index], ...updateData, updatedAt: new Date().toISOString() };
            this.savePrograms(programs);
            this.logAudit('update', 'program', id, updateData.updatedBy);
            return programs[index];
        }
        return null;
    }

    savePrograms(programs) {
        localStorage.setItem('programs', JSON.stringify(programs));
    }

    // === Forms (폼) 관리 ===
    createForm(formData) {
        const forms = this.getForms();
        const newForm = {
            id: this.generateId(),
            programId: formData.programId,
            title: formData.title,
            schema: formData.schema, // JSON 스키마
            version: 1,
            status: 'draft', // draft, published, archived
            createdAt: new Date().toISOString(),
            createdBy: formData.createdBy
        };

        forms.push(newForm);
        this.saveForms(forms);
        this.logAudit('create', 'form', newForm.id, formData.createdBy);
        return newForm;
    }

    getForms() {
        return JSON.parse(localStorage.getItem('forms') || '[]');
    }

    getFormByProgram(programId) {
        const forms = this.getForms();
        return forms.find(f => f.programId === programId && f.status === 'published');
    }

    saveForms(forms) {
        localStorage.setItem('forms', JSON.stringify(forms));
    }

    // === Applications (신청) 관리 ===
    createApplication(applicationData) {
        const applications = this.getApplications();
        const newApplication = {
            id: this.generateId(),
            applicantId: applicationData.applicantId,
            programId: applicationData.programId,
            formId: applicationData.formId,
            applicationNumber: this.generateApplicationNumber(),
            status: 'submitted', // submitted, under_review, approved, rejected, completed
            data: applicationData.data, // 폼 데이터
            score: null,
            memo: '',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        applications.push(newApplication);
        this.saveApplications(applications);
        this.logAudit('create', 'application', newApplication.id, applicationData.applicantId);
        return newApplication;
    }

    getApplications() {
        return JSON.parse(localStorage.getItem('applications') || '[]');
    }

    getApplicationsByProgram(programId) {
        const applications = this.getApplications();
        return applications.filter(a => a.programId === programId);
    }

    getApplicationsByApplicant(applicantId) {
        const applications = this.getApplications();
        return applications.filter(a => a.applicantId === applicantId);
    }

    updateApplication(id, updateData) {
        const applications = this.getApplications();
        const index = applications.findIndex(a => a.id === id);
        if (index !== -1) {
            applications[index] = { ...applications[index], ...updateData, updatedAt: new Date().toISOString() };
            this.saveApplications(applications);
            this.logAudit('update', 'application', id, updateData.updatedBy);
            return applications[index];
        }
        return null;
    }

    saveApplications(applications) {
        localStorage.setItem('applications', JSON.stringify(applications));
    }

    // === Applicants (사용자) 관리 ===
    createApplicant(applicantData) {
        const applicants = this.getApplicants();
        const newApplicant = {
            id: this.generateId(),
            type: applicantData.type, // individual, organization
            name: applicantData.name,
            email: applicantData.email,
            phone: applicantData.phone,
            birthDate: applicantData.birthDate,
            gender: applicantData.gender,
            address: applicantData.address,
            organizationInfo: applicantData.organizationInfo, // 기관인 경우
            verificationStatus: 'pending', // pending, verified, rejected
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        };

        applicants.push(newApplicant);
        this.saveApplicants(applicants);
        this.logAudit('create', 'applicant', newApplicant.id, 'system');
        return newApplicant;
    }

    getApplicants() {
        return JSON.parse(localStorage.getItem('applicants') || '[]');
    }

    getApplicant(id) {
        const applicants = this.getApplicants();
        return applicants.find(a => a.id === id);
    }

    saveApplicants(applicants) {
        localStorage.setItem('applicants', JSON.stringify(applicants));
    }

    // === Reviews (심사) 관리 ===
    createReview(reviewData) {
        const reviews = this.getReviews();
        const newReview = {
            id: this.generateId(),
            applicationId: reviewData.applicationId,
            reviewerId: reviewData.reviewerId,
            round: reviewData.round, // 1차, 2차 등
            score: reviewData.score,
            comment: reviewData.comment,
            status: 'completed', // pending, completed, locked
            submittedAt: new Date().toISOString()
        };

        reviews.push(newReview);
        this.saveReviews(reviews);
        this.logAudit('create', 'review', newReview.id, reviewData.reviewerId);
        return newReview;
    }

    getReviews() {
        return JSON.parse(localStorage.getItem('reviews') || '[]');
    }

    getReviewsByApplication(applicationId) {
        const reviews = this.getReviews();
        return reviews.filter(r => r.applicationId === applicationId);
    }

    saveReviews(reviews) {
        localStorage.setItem('reviews', JSON.stringify(reviews));
    }

    // === Allocations (배분) 관리 ===
    createAllocation(allocationData) {
        const allocations = this.getAllocations();
        const newAllocation = {
            id: this.generateId(),
            programId: allocationData.programId,
            rules: allocationData.rules, // 배분 규칙
            results: allocationData.results, // 배분 결과 JSON
            status: 'simulation', // simulation, confirmed
            confirmedBy: allocationData.confirmedBy,
            confirmedAt: allocationData.confirmedAt,
            createdAt: new Date().toISOString()
        };

        allocations.push(newAllocation);
        this.saveAllocations(allocations);
        this.logAudit('create', 'allocation', newAllocation.id, allocationData.createdBy);
        return newAllocation;
    }

    getAllocations() {
        return JSON.parse(localStorage.getItem('allocations') || '[]');
    }

    saveAllocations(allocations) {
        localStorage.setItem('allocations', JSON.stringify(allocations));
    }

    // === Vouchers (바우처) 관리 ===
    createVoucher(voucherData) {
        const vouchers = this.getVouchers();
        const newVoucher = {
            id: this.generateId(),
            code: this.generateVoucherCode(),
            programId: voucherData.programId,
            applicantId: voucherData.applicantId,
            amount: voucherData.amount,
            balance: voucherData.amount,
            expiryDate: voucherData.expiryDate,
            usageLimit: voucherData.usageLimit || 1,
            status: 'active', // active, used, expired, cancelled
            createdAt: new Date().toISOString(),
            issuedBy: voucherData.issuedBy
        };

        vouchers.push(newVoucher);
        this.saveVouchers(vouchers);
        this.logAudit('create', 'voucher', newVoucher.id, voucherData.issuedBy);
        return newVoucher;
    }

    getVouchers() {
        return JSON.parse(localStorage.getItem('vouchers') || '[]');
    }

    getVouchersByApplicant(applicantId) {
        const vouchers = this.getVouchers();
        return vouchers.filter(v => v.applicantId === applicantId);
    }

    updateVoucher(id, updateData) {
        const vouchers = this.getVouchers();
        const index = vouchers.findIndex(v => v.id === id);
        if (index !== -1) {
            vouchers[index] = { ...vouchers[index], ...updateData };
            this.saveVouchers(vouchers);
            this.logAudit('update', 'voucher', id, updateData.updatedBy);
            return vouchers[index];
        }
        return null;
    }

    saveVouchers(vouchers) {
        localStorage.setItem('vouchers', JSON.stringify(vouchers));
    }

    // === Notifications (알림) 관리 ===
    createNotification(notificationData) {
        const notifications = this.getNotifications();
        const newNotification = {
            id: this.generateId(),
            recipientId: notificationData.recipientId,
            channel: notificationData.channel, // email, sms, kakao, push
            template: notificationData.template,
            content: notificationData.content,
            status: 'pending', // pending, sent, failed
            sentAt: null,
            createdAt: new Date().toISOString()
        };

        notifications.push(newNotification);
        this.saveNotifications(notifications);
        return newNotification;
    }

    getNotifications() {
        return JSON.parse(localStorage.getItem('notifications') || '[]');
    }

    getNotificationsByRecipient(recipientId) {
        const notifications = this.getNotifications();
        return notifications.filter(n => n.recipientId === recipientId);
    }

    saveNotifications(notifications) {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    // === Audit Logs (감사 로그) 관리 ===
    logAudit(action, target, targetId, actor) {
        const auditLogs = this.getAuditLogs();
        const newLog = {
            id: this.generateId(),
            action: action, // create, read, update, delete, approve, reject
            target: target, // program, application, review, etc.
            targetId: targetId,
            actor: actor,
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1', // 실제 환경에서는 실제 IP
            userAgent: navigator.userAgent
        };

        auditLogs.push(newLog);
        this.saveAuditLogs(auditLogs);
    }

    getAuditLogs() {
        return JSON.parse(localStorage.getItem('auditLogs') || '[]');
    }

    saveAuditLogs(auditLogs) {
        localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
    }

    // === 유틸리티 함수들 ===
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateApplicationNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${year}${month}${random}`;
    }

    generateVoucherCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // === 검증 함수들 ===
    validateEligibility(applicantData, programEligibility) {
        const errors = [];
        
        // 연령 검증
        if (programEligibility.ageRange) {
            const age = this.calculateAge(applicantData.birthDate);
            if (age < programEligibility.ageRange.min || age > programEligibility.ageRange.max) {
                errors.push('연령 기준에 맞지 않습니다.');
            }
        }

        // 지역 검증
        if (programEligibility.regions && programEligibility.regions.length > 0) {
            const applicantRegion = applicantData.address.split(' ')[0]; // 시/도
            if (!programEligibility.regions.includes(applicantRegion)) {
                errors.push('지역 기준에 맞지 않습니다.');
            }
        }

        // 소득 검증
        if (programEligibility.incomeCriteria) {
            // 실제 구현에서는 더 정교한 소득 검증 로직 필요
            if (applicantData.incomeLevel && applicantData.incomeLevel > programEligibility.incomeCriteria.max) {
                errors.push('소득 기준에 맞지 않습니다.');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    // 중복 신청 검증
    checkDuplicateApplication(applicantId, programId) {
        const applications = this.getApplications();
        return applications.some(app => 
            app.applicantId === applicantId && 
            app.programId === programId && 
            app.status !== 'rejected'
        );
    }

    // 배분 시뮬레이션
    simulateAllocation(programId, rules) {
        const applications = this.getApplicationsByProgram(programId);
        const program = this.getProgram(programId);
        
        // 기본 조건 충족자 필터링
        let eligibleApplications = applications.filter(app => {
            const applicant = this.getApplicant(app.applicantId);
            const validation = this.validateEligibility(applicant, program.eligibility);
            return validation.isValid && app.status === 'submitted';
        });

        // 점수 기준 정렬
        if (rules.sortBy === 'score') {
            eligibleApplications.sort((a, b) => (b.score || 0) - (a.score || 0));
        }

        // 예산 한도 적용
        const budgetLimit = program.budget;
        let allocatedBudget = 0;
        const selectedApplications = [];

        for (const app of eligibleApplications) {
            const voucherAmount = rules.voucherAmount || 50000;
            if (allocatedBudget + voucherAmount <= budgetLimit) {
                selectedApplications.push({
                    applicationId: app.id,
                    applicantId: app.applicantId,
                    amount: voucherAmount
                });
                allocatedBudget += voucherAmount;
            }
        }

        return {
            totalApplicants: applications.length,
            eligibleApplicants: eligibleApplications.length,
            selectedApplicants: selectedApplications.length,
            allocatedBudget: allocatedBudget,
            remainingBudget: budgetLimit - allocatedBudget,
            results: selectedApplications
        };
    }
}

// 전역 인스턴스 생성
window.dataModel = new DataModel();
