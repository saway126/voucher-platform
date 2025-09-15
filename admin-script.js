// 관리자 패널 JavaScript

// 전역 변수
let currentUser = null;
let currentProgram = null;
let formBuilder = null;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
    loadPrograms();
    initializeFormBuilder();
});

// 관리자 패널 초기화
function initializeAdminPanel() {
    // 현재 사용자 확인 (실제 환경에서는 인증 시스템 필요)
    currentUser = {
        id: 'admin-001',
        name: '관리자',
        role: 'admin',
        email: 'admin@kfhi.or.kr'
    };
    
    // 관리자 버튼 표시
    const adminBtn = document.querySelector('.btn-admin');
    if (adminBtn) {
        adminBtn.style.display = 'block';
    }
}

// 관리자 패널 표시
function showAdminPanel() {
    const modal = document.getElementById('adminModal');
    modal.style.display = 'flex';
    loadDashboard();
}

// 관리자 패널 닫기
function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    modal.style.display = 'none';
}

// 관리자 탭 전환
function showAdminTab(tabName) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 모든 탭 패널 숨기기
    document.querySelectorAll('.admin-tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    const activeButton = document.querySelector(`[onclick="showAdminTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const activePanel = document.getElementById(`admin-${tabName}`);
    if (activePanel) {
        activePanel.classList.add('active');
    }
    
    // 탭별 데이터 로드
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'programs':
            loadProgramsTable();
            break;
        case 'applications':
            loadApplicationsTable();
            break;
        case 'reviews':
            loadReviewsManagement();
            break;
        case 'allocations':
            loadAllocationsManagement();
            break;
        case 'vouchers':
            loadVouchersTable();
            break;
        case 'notifications':
            loadNotificationsManagement();
            break;
    }
}

// 대시보드 로드
function loadDashboard() {
    const programs = window.dataModel.getPrograms();
    const applications = window.dataModel.getApplications();
    const vouchers = window.dataModel.getVouchers();
    
    // 통계 업데이트
    document.getElementById('activePrograms').textContent = 
        programs.filter(p => p.status === 'published').length;
    document.getElementById('totalApplicants').textContent = applications.length;
    document.getElementById('approvedVouchers').textContent = 
        vouchers.filter(v => v.status === 'active').length;
    document.getElementById('usedVouchers').textContent = 
        vouchers.filter(v => v.status === 'used').length;
}

// 프로그램 목록 로드
function loadPrograms() {
    const programs = window.dataModel.getPrograms();
    const programsGrid = document.getElementById('programsGrid');
    
    if (programs.length === 0) {
        // 샘플 데이터 생성
        createSamplePrograms();
        loadPrograms(); // 재귀 호출로 다시 로드
        return;
    }
    
    programsGrid.innerHTML = programs.map(program => `
        <div class="program-card" data-program-id="${program.id}">
            <div class="program-card-header">
                <h3>${program.title}</h3>
                <div class="program-type">${getProgramTypeText(program.type)}</div>
            </div>
            <div class="program-card-body">
                <p>${program.description}</p>
                <div class="program-schedule">
                    <div class="schedule-item">
                        <div class="label">신청 시작</div>
                        <div class="date">${formatDate(program.schedule.applicationStart)}</div>
                    </div>
                    <div class="schedule-item">
                        <div class="label">신청 마감</div>
                        <div class="date">${formatDate(program.schedule.applicationEnd)}</div>
                    </div>
                </div>
            </div>
            <div class="program-card-footer">
                <span class="program-status ${getProgramStatus(program)}">${getStatusText(program.status)}</span>
                <button class="btn-primary" onclick="applyToProgram('${program.id}')">신청하기</button>
            </div>
        </div>
    `).join('');
}

// 샘플 프로그램 생성
function createSamplePrograms() {
    const samplePrograms = [
        {
            title: '2024년 교육 바우처 지원사업',
            description: '취약계층을 위한 교육비 지원 바우처를 제공합니다.',
            type: 'announcement',
            budget: 100000000,
            maxApplicants: 200,
            schedule: {
                applicationStart: '2024-01-01T00:00:00',
                applicationEnd: '2024-03-31T23:59:59',
                reviewStart: '2024-04-01T00:00:00',
                reviewEnd: '2024-04-30T23:59:59',
                announcementDate: '2024-05-15T00:00:00'
            },
            eligibility: {
                ageRange: { min: 18, max: 65 },
                regions: ['서울특별시', '경기도', '인천광역시'],
                incomeCriteria: { max: 2000000 }
            },
            template: 'education',
            createdBy: 'admin-001'
        },
        {
            title: '문화예술 체험 바우처',
            description: '문화예술 활동 참여를 위한 바우처를 지원합니다.',
            type: 'competition',
            budget: 50000000,
            maxApplicants: 100,
            schedule: {
                applicationStart: '2024-02-01T00:00:00',
                applicationEnd: '2024-04-30T23:59:59',
                reviewStart: '2024-05-01T00:00:00',
                reviewEnd: '2024-05-31T23:59:59',
                announcementDate: '2024-06-15T00:00:00'
            },
            eligibility: {
                ageRange: { min: 6, max: 80 },
                regions: ['전국'],
                incomeCriteria: { max: 3000000 }
            },
            template: 'culture',
            createdBy: 'admin-001'
        }
    ];
    
    samplePrograms.forEach(programData => {
        window.dataModel.createProgram(programData);
    });
}

// 프로그램 테이블 로드
function loadProgramsTable() {
    const programs = window.dataModel.getPrograms();
    const tbody = document.getElementById('programsTableBody');
    
    tbody.innerHTML = programs.map(program => `
        <tr>
            <td>${program.title}</td>
            <td>${getProgramTypeText(program.type)}</td>
            <td><span class="program-status ${getProgramStatus(program)}">${getStatusText(program.status)}</span></td>
            <td>${program.budget.toLocaleString()}원</td>
            <td>${window.dataModel.getApplicationsByProgram(program.id).length}명</td>
            <td>
                <button class="btn-small" onclick="editProgram('${program.id}')">편집</button>
                <button class="btn-small" onclick="deleteProgram('${program.id}')">삭제</button>
            </td>
        </tr>
    `).join('');
}

// 사업 생성 모달 표시
function showCreateProgramModal() {
    const modal = document.getElementById('createProgramModal');
    modal.style.display = 'flex';
}

// 사업 생성 모달 닫기
function closeCreateProgramModal() {
    const modal = document.getElementById('createProgramModal');
    modal.style.display = 'none';
    document.getElementById('createProgramForm').reset();
}

// 사업 생성 폼 처리
document.getElementById('createProgramForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const programData = {
        title: formData.get('title'),
        description: formData.get('description'),
        type: formData.get('type'),
        budget: parseInt(formData.get('budget')),
        maxApplicants: parseInt(formData.get('maxApplicants')),
        schedule: {
            applicationStart: formData.get('applicationStart'),
            applicationEnd: formData.get('applicationEnd'),
            reviewStart: formData.get('applicationEnd'), // 간단히 마감일로 설정
            reviewEnd: formData.get('announcementDate'),
            announcementDate: formData.get('announcementDate')
        },
        eligibility: {
            ageRange: { min: 18, max: 65 },
            regions: ['전국'],
            incomeCriteria: { max: 3000000 }
        },
        template: 'default',
        createdBy: currentUser.id
    };
    
    window.dataModel.createProgram(programData);
    showNotification('새 사업이 생성되었습니다.', 'success');
    closeCreateProgramModal();
    loadPrograms();
    loadProgramsTable();
});

// 폼 빌더 초기화
function initializeFormBuilder() {
    const formElements = document.querySelectorAll('.form-element');
    const canvas = document.getElementById('formCanvas');
    
    // 드래그 앤 드롭 이벤트
    formElements.forEach(element => {
        element.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.type);
        });
    });
    
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        const elementType = e.dataTransfer.getData('text/plain');
        addFormElement(elementType);
    });
}

// 폼 요소 추가
function addFormElement(type) {
    const canvas = document.getElementById('formCanvas');
    const placeholder = canvas.querySelector('.canvas-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    const elementId = 'element-' + Date.now();
    const elementHtml = createFormElementHtml(type, elementId);
    
    canvas.insertAdjacentHTML('beforeend', elementHtml);
    
    // 이벤트 리스너 추가
    const newElement = canvas.lastElementChild;
    addElementEventListeners(newElement);
}

// 폼 요소 HTML 생성
function createFormElementHtml(type, id) {
    const baseHtml = `
        <div class="canvas-element" data-type="${type}" data-id="${id}">
            <div class="element-controls">
                <button onclick="editFormElement('${id}')">편집</button>
                <button onclick="deleteFormElement('${id}')">삭제</button>
            </div>
    `;
    
    switch(type) {
        case 'text':
            return baseHtml + `
                <label>텍스트 입력</label>
                <input type="text" placeholder="텍스트를 입력하세요">
            </div>`;
        case 'number':
            return baseHtml + `
                <label>숫자 입력</label>
                <input type="number" placeholder="숫자를 입력하세요">
            </div>`;
        case 'select':
            return baseHtml + `
                <label>선택 박스</label>
                <select>
                    <option>옵션 1</option>
                    <option>옵션 2</option>
                </select>
            </div>`;
        case 'textarea':
            return baseHtml + `
                <label>텍스트 영역</label>
                <textarea placeholder="내용을 입력하세요"></textarea>
            </div>`;
        case 'file':
            return baseHtml + `
                <label>파일 업로드</label>
                <input type="file">
            </div>`;
        case 'date':
            return baseHtml + `
                <label>날짜 선택</label>
                <input type="date">
            </div>`;
        default:
            return baseHtml + `<p>알 수 없는 요소</p></div>`;
    }
}

// 폼 요소 이벤트 리스너 추가
function addElementEventListeners(element) {
    // 편집 버튼
    const editBtn = element.querySelector('[onclick*="editFormElement"]');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            const elementId = element.dataset.id;
            editFormElement(elementId);
        });
    }
    
    // 삭제 버튼
    const deleteBtn = element.querySelector('[onclick*="deleteFormElement"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const elementId = element.dataset.id;
            deleteFormElement(elementId);
        });
    }
}

// 폼 요소 편집
function editFormElement(elementId) {
    const element = document.querySelector(`[data-id="${elementId}"]`);
    if (!element) return;
    
    const newLabel = prompt('라벨을 입력하세요:', element.querySelector('label').textContent);
    if (newLabel) {
        element.querySelector('label').textContent = newLabel;
    }
}

// 폼 요소 삭제
function deleteFormElement(elementId) {
    const element = document.querySelector(`[data-id="${elementId}"]`);
    if (element && confirm('이 요소를 삭제하시겠습니까?')) {
        element.remove();
        
        // 캔버스가 비어있으면 플레이스홀더 표시
        const canvas = document.getElementById('formCanvas');
        if (canvas.children.length === 0) {
            canvas.innerHTML = '<p class="canvas-placeholder">폼 요소를 여기로 드래그하세요</p>';
        }
    }
}

// 신청 관리 테이블 로드
function loadApplicationsTable() {
    const applications = window.dataModel.getApplications();
    const tbody = document.getElementById('applicationsTableBody');
    
    tbody.innerHTML = applications.map(app => {
        const applicant = window.dataModel.getApplicant(app.applicantId);
        const program = window.dataModel.getProgram(app.programId);
        
        return `
            <tr>
                <td>${app.applicationNumber}</td>
                <td>${applicant ? applicant.name : '알 수 없음'}</td>
                <td>${program ? program.title : '알 수 없음'}</td>
                <td><span class="status-badge ${app.status}">${getStatusText(app.status)}</span></td>
                <td>${formatDate(app.submittedAt)}</td>
                <td>
                    <button class="btn-small" onclick="viewApplication('${app.id}')">보기</button>
                    <button class="btn-small" onclick="updateApplicationStatus('${app.id}')">상태변경</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 심사 관리 로드
function loadReviewsManagement() {
    const applications = window.dataModel.getApplications();
    const applicationSelect = document.getElementById('applicationSelect');
    
    applicationSelect.innerHTML = '<option value="">신청서 선택</option>' +
        applications.map(app => {
            const applicant = window.dataModel.getApplicant(app.applicantId);
            const program = window.dataModel.getProgram(app.programId);
            return `<option value="${app.id}">${app.applicationNumber} - ${applicant ? applicant.name : '알 수 없음'} (${program ? program.title : '알 수 없음'})</option>`;
        }).join('');
    
    loadReviewList();
}

// 심사 목록 로드
function loadReviewList() {
    const reviews = window.dataModel.getReviews();
    const reviewList = document.getElementById('reviewList');
    
    reviewList.innerHTML = reviews.map(review => {
        const application = window.dataModel.getApplications().find(app => app.id === review.applicationId);
        const applicant = application ? window.dataModel.getApplicant(application.applicantId) : null;
        
        return `
            <div class="review-item">
                <h5>${application ? application.applicationNumber : '알 수 없음'}</h5>
                <p>신청자: ${applicant ? applicant.name : '알 수 없음'}</p>
                <p>점수: ${review.score || '미평가'}</p>
                <p>상태: ${getStatusText(review.status)}</p>
            </div>
        `;
    }).join('');
}

// 심사위원 배정
function assignReviewer() {
    const reviewerId = document.getElementById('reviewerSelect').value;
    const applicationId = document.getElementById('applicationSelect').value;
    
    if (!reviewerId || !applicationId) {
        showNotification('심사위원과 신청서를 모두 선택해주세요.', 'error');
        return;
    }
    
    const reviewData = {
        applicationId: applicationId,
        reviewerId: reviewerId,
        round: 1,
        score: null,
        comment: '',
        status: 'pending'
    };
    
    window.dataModel.createReview(reviewData);
    showNotification('심사위원이 배정되었습니다.', 'success');
    loadReviewList();
}

// 배분 관리 로드
function loadAllocationsManagement() {
    // 배분 설정 초기화
    document.getElementById('allocationMethod').value = 'score';
    document.getElementById('voucherAmount').value = '50000';
}

// 배분 시뮬레이션
function simulateAllocation() {
    const method = document.getElementById('allocationMethod').value;
    const amount = parseInt(document.getElementById('voucherAmount').value);
    
    if (!method || !amount) {
        showNotification('배분 방식과 바우처 금액을 입력해주세요.', 'error');
        return;
    }
    
    // 현재 선택된 프로그램이 있다면 해당 프로그램으로 시뮬레이션
    const programs = window.dataModel.getPrograms();
    if (programs.length === 0) {
        showNotification('시뮬레이션할 사업이 없습니다.', 'error');
        return;
    }
    
    const program = programs[0]; // 첫 번째 프로그램 사용
    const rules = {
        sortBy: method,
        voucherAmount: amount
    };
    
    const result = window.dataModel.simulateAllocation(program.id, rules);
    
    // 결과 표시
    const resultsDiv = document.getElementById('allocationResults');
    resultsDiv.innerHTML = `
        <div class="allocation-summary">
            <h5>배분 시뮬레이션 결과</h5>
            <p>총 신청자: ${result.totalApplicants}명</p>
            <p>자격 충족자: ${result.eligibleApplicants}명</p>
            <p>선정자: ${result.selectedApplicants}명</p>
            <p>배분 예산: ${result.allocatedBudget.toLocaleString()}원</p>
            <p>잔여 예산: ${result.remainingBudget.toLocaleString()}원</p>
        </div>
        <div class="allocation-details">
            <h6>선정자 목록</h6>
            ${result.results.map(item => {
                const applicant = window.dataModel.getApplicant(item.applicantId);
                return `<div class="allocation-result-item">
                    <h5>${applicant ? applicant.name : '알 수 없음'}</h5>
                    <p>금액: ${item.amount.toLocaleString()}원</p>
                </div>`;
            }).join('')}
        </div>
    `;
    
    showNotification('배분 시뮬레이션이 완료되었습니다.', 'success');
}

// 바우처 관리 테이블 로드
function loadVouchersTable() {
    const vouchers = window.dataModel.getVouchers();
    const tbody = document.getElementById('vouchersTableBody');
    
    tbody.innerHTML = vouchers.map(voucher => {
        const applicant = window.dataModel.getApplicant(voucher.applicantId);
        const program = window.dataModel.getProgram(voucher.programId);
        
        return `
            <tr>
                <td>${voucher.code}</td>
                <td>${applicant ? applicant.name : '알 수 없음'}</td>
                <td>${voucher.amount.toLocaleString()}원</td>
                <td>${voucher.balance.toLocaleString()}원</td>
                <td><span class="status-badge ${voucher.status}">${getVoucherStatusText(voucher.status)}</span></td>
                <td>${formatDate(voucher.expiryDate)}</td>
                <td>
                    <button class="btn-small" onclick="viewVoucher('${voucher.id}')">보기</button>
                    <button class="btn-small" onclick="updateVoucherStatus('${voucher.id}')">상태변경</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 알림 관리 로드
function loadNotificationsManagement() {
    // 알림 템플릿과 발송 기능은 이미 HTML에 구현됨
}

// 알림 발송
function sendNotification() {
    const template = document.getElementById('notificationTemplate').value;
    const channel = document.getElementById('notificationChannel').value;
    
    if (!template || !channel) {
        showNotification('템플릿과 채널을 선택해주세요.', 'error');
        return;
    }
    
    // 실제 구현에서는 선택된 수신자들에게 발송
    showNotification('알림이 발송되었습니다.', 'success');
}

// 유틸리티 함수들
function getProgramTypeText(type) {
    const types = {
        'announcement': '공고형',
        'competition': '공모형',
        'emergency': '긴급지원형'
    };
    return types[type] || type;
}

function getStatusText(status) {
    const statuses = {
        'draft': '초안',
        'published': '공개',
        'closed': '마감',
        'completed': '완료',
        'submitted': '제출됨',
        'under_review': '심사중',
        'approved': '승인',
        'rejected': '거부',
        'active': '활성',
        'used': '사용됨',
        'expired': '만료',
        'cancelled': '취소됨'
    };
    return statuses[status] || status;
}

function getVoucherStatusText(status) {
    const statuses = {
        'active': '활성',
        'used': '사용됨',
        'expired': '만료',
        'cancelled': '취소됨'
    };
    return statuses[status] || status;
}

function getProgramStatus(program) {
    const now = new Date();
    const applicationEnd = new Date(program.schedule.applicationEnd);
    const announcementDate = new Date(program.schedule.announcementDate);
    
    if (now < applicationEnd) {
        return 'open';
    } else if (now < announcementDate) {
        return 'closed';
    } else {
        return 'announced';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}

// 프로그램 신청
function applyToProgram(programId) {
    const program = window.dataModel.getProgram(programId);
    if (!program) {
        showNotification('사업 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    // 신청 폼으로 스크롤
    scrollToSection('apply');
    
    // 선택된 프로그램 정보 표시
    showNotification(`${program.title} 신청을 시작합니다.`, 'info');
}

// 섹션으로 스크롤
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 알림 표시 (기존 함수 재사용)
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // 스타일 추가
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    
    // 알림 내용 스타일
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: 1rem;
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}
