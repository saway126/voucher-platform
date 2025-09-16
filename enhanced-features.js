// 향상된 기능들

// 프로그램 필터 초기화
function initializeProgramFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 활성 버튼 변경
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 필터링 적용
            const status = this.dataset.status;
            filterPrograms(status);
        });
    });
}

// 프로그램 필터링
function filterPrograms(status) {
    const programs = window.dataModel.getPrograms();
    const programsGrid = document.getElementById('programsGrid');
    
    let filteredPrograms = programs;
    
    if (status !== 'all') {
        filteredPrograms = programs.filter(program => {
            const programStatus = getProgramStatus(program);
            return programStatus === status;
        });
    }
    
    programsGrid.innerHTML = filteredPrograms.map(program => `
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
                <span class="program-status ${getProgramStatus(program)}">${getStatusText(getProgramStatus(program))}</span>
                <button class="btn-primary" onclick="selectProgram('${program.id}')">신청하기</button>
            </div>
        </div>
    `).join('');
}

// 프로그램 선택
function selectProgram(programId) {
    const program = window.dataModel.getProgram(programId);
    if (!program) {
        showNotification('사업 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    // 선택된 프로그램 저장
    localStorage.setItem('selectedProgram', JSON.stringify(program));
    
    // 신청 폼으로 스크롤
    scrollToSection('apply');
    
    // 선택된 프로그램 정보 표시
    showNotification(`${program.title} 신청을 시작합니다.`, 'info');
    
    // 신청 폼에 프로그램 정보 표시
    updateApplicationForm(program);
}

// 신청 폼 업데이트
function updateApplicationForm(program) {
    const form = document.getElementById('voucherForm');
    if (!form) return;
    
    // 프로그램 정보 표시를 위한 요소 추가 또는 업데이트
    let programInfo = form.querySelector('.selected-program-info');
    if (!programInfo) {
        programInfo = document.createElement('div');
        programInfo.className = 'selected-program-info';
        form.insertBefore(programInfo, form.firstChild);
    }
    
    programInfo.innerHTML = `
        <div class="program-info-card">
            <h3>선택된 사업</h3>
            <h4>${program.title}</h4>
            <p>${program.description}</p>
            <div class="program-details">
                <span>예산: ${program.budget.toLocaleString()}원</span>
                <span>마감: ${formatDate(program.schedule.applicationEnd)}</span>
            </div>
        </div>
    `;
}

// 선택된 프로그램 조회
function getSelectedProgram() {
    const selectedProgramData = localStorage.getItem('selectedProgram');
    if (selectedProgramData) {
        return JSON.parse(selectedProgramData);
    }
    return null;
}

// 이메일로 신청자 조회
function findApplicantByEmail(email) {
    const applicants = window.dataModel.getApplicants();
    return applicants.find(applicant => applicant.email === email);
}

// 회원가입 모달 표시
function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>회원가입</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <form id="registerForm">
                <div class="form-group">
                    <label for="registerName">이름</label>
                    <input type="text" id="registerName" name="name" required>
                </div>
                <div class="form-group">
                    <label for="registerEmail">이메일</label>
                    <input type="email" id="registerEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="registerPhone">휴대폰 번호</label>
                    <input type="tel" id="registerPhone" name="phone" required>
                </div>
                <div class="form-group">
                    <label for="registerPassword">비밀번호</label>
                    <input type="password" id="registerPassword" name="password" required>
                </div>
                <div class="form-group">
                    <label for="registerConfirmPassword">비밀번호 확인</label>
                    <input type="password" id="registerConfirmPassword" name="confirmPassword" required>
                </div>
                <div class="form-group">
                    <label for="registerBirthDate">생년월일</label>
                    <input type="date" id="registerBirthDate" name="birthDate" required>
                </div>
                <div class="form-group">
                    <label for="registerGender">성별</label>
                    <select id="registerGender" name="gender">
                        <option value="">선택해주세요</option>
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="registerAddress">주소</label>
                    <input type="text" id="registerAddress" name="address" placeholder="시/도 시/군/구" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">취소</button>
                    <button type="submit" class="btn-primary">회원가입</button>
                </div>
            </form>
        </div>
    `;
    
    // 모달 스타일
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.querySelector('.modal-content').style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        max-height: 90%;
        overflow-y: auto;
    `;
    
    document.body.appendChild(modal);
    
    // 회원가입 폼 처리
    modal.querySelector('#registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            showNotification('비밀번호가 일치하지 않습니다.', 'error');
            return;
        }
        
        // 신청자 생성
        const applicant = window.dataModel.createApplicant({
            type: 'individual',
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            birthDate: formData.get('birthDate'),
            gender: formData.get('gender'),
            address: formData.get('address')
        });
        
        showNotification('회원가입이 완료되었습니다.', 'success');
        modal.remove();
    });
}

// 사용자 인터페이스 업데이트
function updateUserInterface() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const userMenu = document.querySelector('.user-menu');
    
    if (currentUser) {
        userMenu.innerHTML = `
            <span class="user-name">${currentUser.name}님</span>
            <button class="btn-logout" onclick="logout()">로그아웃</button>
        `;
    } else {
        userMenu.innerHTML = `
            <button class="btn-login" onclick="showLoginModal()">로그인</button>
            <button class="btn-register" onclick="showRegisterModal()">회원가입</button>
            <button class="btn-demo" onclick="loginAsDemo()">데모 로그인</button>
        `;
    }
}

// 데모 로그인
function loginAsDemo() {
    // 데모 사용자 생성
    const demoUser = {
        id: 'demo-user-001',
        name: '데모 사용자',
        email: 'demo@example.com',
        phone: '010-1234-5678',
        type: 'individual',
        birthDate: '1990-01-01',
        gender: 'male',
        address: '서울특별시 강남구'
    };
    
    // 로컬 스토리지에 저장
    localStorage.setItem('currentUser', JSON.stringify(demoUser));
    
    // 기존 신청자 목록에 추가 (없는 경우)
    const existingApplicant = findApplicantByEmail(demoUser.email);
    if (!existingApplicant) {
        window.dataModel.createApplicant(demoUser);
    }
    
    showNotification('데모 사용자로 로그인되었습니다!', 'success');
    updateUserInterface();
    updateMyPage();
}

// 로그아웃
function logout() {
    localStorage.removeItem('currentUser');
    showNotification('로그아웃되었습니다.', 'info');
    updateUserInterface();
}

// 마이페이지 업데이트
function updateMyPage() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        // 로그인하지 않은 경우 데모 데이터 표시
        updateMyApplications('demo-user-001');
        updateMyVouchers('demo-user-001');
        updateMyNotifications('demo-user-001');
        return;
    }
    
    // 내 신청서 목록 업데이트
    updateMyApplications(currentUser.id);
    
    // 내 바우처 목록 업데이트
    updateMyVouchers(currentUser.id);
    
    // 내 알림 목록 업데이트
    updateMyNotifications(currentUser.id);
}

// 내 신청서 목록 업데이트
function updateMyApplications(applicantId) {
    const applications = window.dataModel.getApplicationsByApplicant(applicantId);
    const myApplicationsTab = document.getElementById('my-applications');
    
    if (!myApplicationsTab) return;
    
    myApplicationsTab.innerHTML = `
        <div class="applications-list">
            ${applications.map(app => {
                const program = window.dataModel.getProgram(app.programId);
                return `
                    <div class="application-item">
                        <div class="application-info">
                            <h3>${program ? program.title : '알 수 없음'}</h3>
                            <p>신청번호: ${app.applicationNumber}</p>
                            <p>신청일: ${formatDate(app.submittedAt)}</p>
                            <p>상태: <span class="status-badge ${app.status}">${getStatusText(app.status)}</span></p>
                        </div>
                        <div class="application-actions">
                            <button class="btn-small" onclick="viewApplication('${app.id}')">상세보기</button>
                            ${app.status === 'submitted' ? 
                                `<button class="btn-small" onclick="cancelApplication('${app.id}')">취소</button>` : 
                                ''
                            }
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 내 바우처 목록 업데이트
function updateMyVouchers(applicantId) {
    const vouchers = window.dataModel.getVouchersByApplicant(applicantId);
    const myVouchersTab = document.getElementById('my-vouchers');
    
    if (!myVouchersTab) return;
    
    myVouchersTab.innerHTML = `
        <div class="vouchers-list">
            ${vouchers.map(voucher => {
                const program = window.dataModel.getProgram(voucher.programId);
                return `
                    <div class="voucher-item">
                        <div class="voucher-info">
                            <h3>${program ? program.title : '알 수 없음'}</h3>
                            <p>바우처 코드: ${voucher.code}</p>
                            <p>금액: ${voucher.amount.toLocaleString()}원</p>
                            <p>잔액: ${voucher.balance.toLocaleString()}원</p>
                            <p>만료일: ${formatDate(voucher.expiryDate)}</p>
                            <p>상태: <span class="status-badge ${voucher.status}">${getVoucherStatusText(voucher.status)}</span></p>
                        </div>
                        <div class="voucher-actions">
                            ${voucher.status === 'active' ? 
                                `<button class="btn-small" onclick="useVoucher('${voucher.id}')">사용하기</button>` : 
                                ''
                            }
                            <button class="btn-small" onclick="viewVoucherDetails('${voucher.id}')">상세보기</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 내 알림 목록 업데이트
function updateMyNotifications(applicantId) {
    const notifications = window.dataModel.getNotificationsByRecipient(applicantId);
    const notificationsTab = document.getElementById('notifications');
    
    if (!notificationsTab) return;
    
    notificationsTab.innerHTML = `
        <div class="notifications-list">
            ${notifications.map(notification => `
                <div class="notification-item">
                    <i class="fas fa-bell"></i>
                    <div class="notification-content">
                        <h4>${notification.template}</h4>
                        <p>${notification.content}</p>
                        <span class="time">${formatDate(notification.createdAt)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 신청서 상세보기
function viewApplication(applicationId) {
    const application = window.dataModel.getApplications().find(app => app.id === applicationId);
    if (!application) return;
    
    const program = window.dataModel.getProgram(application.programId);
    const applicant = window.dataModel.getApplicant(application.applicantId);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>신청서 상세보기</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="application-details">
                <h3>${program ? program.title : '알 수 없음'}</h3>
                <div class="detail-section">
                    <h4>신청 정보</h4>
                    <p><strong>신청번호:</strong> ${application.applicationNumber}</p>
                    <p><strong>신청자:</strong> ${applicant ? applicant.name : '알 수 없음'}</p>
                    <p><strong>신청일:</strong> ${formatDate(application.submittedAt)}</p>
                    <p><strong>상태:</strong> <span class="status-badge ${application.status}">${getStatusText(application.status)}</span></p>
                </div>
                <div class="detail-section">
                    <h4>신청 내용</h4>
                    ${Object.entries(application.data).map(([key, value]) => `
                        <p><strong>${key}:</strong> ${value}</p>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.querySelector('.modal-content').style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 10px;
        max-width: 600px;
        width: 90%;
        max-height: 90%;
        overflow-y: auto;
    `;
    
    document.body.appendChild(modal);
}

// 바우처 사용
function useVoucher(voucherId) {
    const voucher = window.dataModel.getVouchers().find(v => v.id === voucherId);
    if (!voucher) return;
    
    const amount = prompt('사용할 금액을 입력하세요:', '10000');
    if (!amount || isNaN(amount) || amount <= 0) {
        showNotification('올바른 금액을 입력해주세요.', 'error');
        return;
    }
    
    const useAmount = parseInt(amount);
    if (useAmount > voucher.balance) {
        showNotification('잔액이 부족합니다.', 'error');
        return;
    }
    
    // 바우처 잔액 차감
    const updatedVoucher = window.dataModel.updateVoucher(voucherId, {
        balance: voucher.balance - useAmount,
        status: voucher.balance - useAmount === 0 ? 'used' : 'active',
        updatedBy: 'system'
    });
    
    if (updatedVoucher) {
        showNotification(`${useAmount.toLocaleString()}원이 사용되었습니다.`, 'success');
        updateMyVouchers(JSON.parse(localStorage.getItem('currentUser') || '{}').id);
    }
}

// 바우처 상세보기
function viewVoucherDetails(voucherId) {
    const voucher = window.dataModel.getVouchers().find(v => v.id === voucherId);
    if (!voucher) return;
    
    const program = window.dataModel.getProgram(voucher.programId);
    const applicant = window.dataModel.getApplicant(voucher.applicantId);
    
    alert(`바우처 상세 정보\n\n사업명: ${program ? program.title : '알 수 없음'}\n바우처 코드: ${voucher.code}\n금액: ${voucher.amount.toLocaleString()}원\n잔액: ${voucher.balance.toLocaleString()}원\n만료일: ${formatDate(voucher.expiryDate)}\n상태: ${getVoucherStatusText(voucher.status)}`);
}

// 유틸리티 함수들
function getVoucherStatusText(status) {
    const statuses = {
        'active': '활성',
        'used': '사용됨',
        'expired': '만료',
        'cancelled': '취소됨'
    };
    return statuses[status] || status;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 프로그램 필터 초기화
    initializeProgramFilters();
    
    // 사용자 인터페이스 업데이트 (매개변수 없이 호출하지 않음)
    // updateUserInterface는 index.html에서 정의됨
    
    // 마이페이지 업데이트
    updateMyPage();
});
