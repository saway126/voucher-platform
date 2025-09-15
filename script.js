// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 바우처 신청 폼 처리
    const voucherForm = document.getElementById('voucherForm');
    if (voucherForm) {
        voucherForm.addEventListener('submit', handleVoucherApplication);
    }
    
    // 탭 기능 초기화
    initializeTabs();
    
    // 스무스 스크롤 초기화
    initializeSmoothScroll();
    
    // 헤더 스크롤 효과
    initializeHeaderScroll();
    
    // 프로그램 필터 초기화
    // initializeProgramFilters(); // enhanced-features.js에서 처리됨
    
    // 로그인/회원가입 모달 초기화
    // initializeAuthModals(); // enhanced-features.js에서 처리됨
});

// 바우처 신청 처리
function handleVoucherApplication(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // 신청자 정보 생성 또는 조회
    let applicant = findApplicantByEmail(formData.get('email'));
    if (!applicant) {
        applicant = window.dataModel.createApplicant({
            type: 'individual',
            name: formData.get('applicantName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            birthDate: formData.get('birthDate') || '1990-01-01',
            gender: formData.get('gender') || 'male',
            address: formData.get('address') || '서울특별시'
        });
    }
    
    // 선택된 프로그램이 있는지 확인
    const selectedProgram = getSelectedProgram();
    if (!selectedProgram) {
        showNotification('신청할 사업을 선택해주세요.', 'error');
        return;
    }
    
    // 중복 신청 검증
    if (window.dataModel.checkDuplicateApplication(applicant.id, selectedProgram.id)) {
        showNotification('이미 신청한 사업입니다.', 'error');
        return;
    }
    
    // 자격 검증
    const validation = window.dataModel.validateEligibility(applicant, selectedProgram.eligibility);
    if (!validation.isValid) {
        showNotification('자격 기준에 맞지 않습니다: ' + validation.errors.join(', '), 'error');
        return;
    }
    
    // 신청서 생성
    const applicationData = {
        applicantId: applicant.id,
        programId: selectedProgram.id,
        formId: null, // 폼 빌더로 생성된 폼이 있으면 사용
        data: {
            applicantName: formData.get('applicantName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            voucherType: formData.get('voucherType'),
            purpose: formData.get('purpose'),
            birthDate: formData.get('birthDate'),
            gender: formData.get('gender'),
            address: formData.get('address')
        }
    };
    
    const application = window.dataModel.createApplication(applicationData);
    
    // 성공 메시지 표시
    showNotification(`바우처 신청이 완료되었습니다! (신청번호: ${application.applicationNumber})`, 'success');
    
    // 폼 초기화
    event.target.reset();
    
    // 마이페이지로 이동
    setTimeout(() => {
        scrollToSection('manage');
        showTab('my-applications');
    }, 1500);
}

// 탭 기능 초기화
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.textContent.toLowerCase().replace(/\s+/g, '-');
            showTab(targetTab);
        });
    });
}

// 탭 표시 함수
function showTab(tabName) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 모든 탭 패널 숨기기
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // 선택된 탭 버튼 활성화
    const activeButton = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.textContent.toLowerCase().replace(/\s+/g, '-') === tabName
    );
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // 선택된 탭 패널 표시
    const activePanel = document.getElementById(tabName);
    if (activePanel) {
        activePanel.classList.add('active');
    }
    
    // 바우처 목록 업데이트
    if (tabName === 'my-vouchers') {
        updateVoucherList();
    }
}

// 바우처 목록 업데이트
function updateVoucherList() {
    const voucherList = document.querySelector('.voucher-list');
    if (!voucherList) return;
    
    // 로컬 스토리지에서 바우처 데이터 가져오기
    const vouchers = JSON.parse(localStorage.getItem('userVouchers') || '[]');
    
    if (vouchers.length === 0) {
        // 기본 바우처 데이터 생성
        const defaultVouchers = [
            {
                id: 1,
                type: '교육 바우처',
                balance: 50000,
                expiryDate: '2024-12-31',
                status: 'active'
            },
            {
                id: 2,
                type: '문화 바우처',
                balance: 30000,
                expiryDate: '2024-11-30',
                status: 'active'
            }
        ];
        localStorage.setItem('userVouchers', JSON.stringify(defaultVouchers));
        displayVouchers(defaultVouchers);
    } else {
        displayVouchers(vouchers);
    }
}

// 바우처 표시
function displayVouchers(vouchers) {
    const voucherList = document.querySelector('.voucher-list');
    if (!voucherList) return;
    
    voucherList.innerHTML = vouchers.map(voucher => `
        <div class="voucher-item">
            <div class="voucher-info">
                <h3>${voucher.type}</h3>
                <p>잔액: ${voucher.balance.toLocaleString()}원</p>
                <p>만료일: ${voucher.expiryDate}</p>
            </div>
            <div class="voucher-actions">
                <button class="btn-small" onclick="useVoucher(${voucher.id})">사용하기</button>
                <button class="btn-small" onclick="viewVoucherDetails(${voucher.id})">상세보기</button>
            </div>
        </div>
    `).join('');
}

// 바우처 사용
function useVoucher(voucherId) {
    const vouchers = JSON.parse(localStorage.getItem('userVouchers') || '[]');
    const voucher = vouchers.find(v => v.id === voucherId);
    
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
    voucher.balance -= useAmount;
    localStorage.setItem('userVouchers', JSON.stringify(vouchers));
    
    // 사용 내역 저장
    const usageHistory = JSON.parse(localStorage.getItem('usageHistory') || '[]');
    usageHistory.unshift({
        id: Date.now(),
        voucherId: voucherId,
        voucherType: voucher.type,
        amount: useAmount,
        date: new Date().toISOString().split('T')[0],
        description: `${voucher.type} 사용`
    });
    localStorage.setItem('usageHistory', JSON.stringify(usageHistory));
    
    showNotification(`${useAmount.toLocaleString()}원이 사용되었습니다.`, 'success');
    updateVoucherList();
    updateUsageHistory();
}

// 바우처 상세보기
function viewVoucherDetails(voucherId) {
    const vouchers = JSON.parse(localStorage.getItem('userVouchers') || '[]');
    const voucher = vouchers.find(v => v.id === voucherId);
    
    if (!voucher) return;
    
    alert(`바우처 상세 정보\n\n유형: ${voucher.type}\n잔액: ${voucher.balance.toLocaleString()}원\n만료일: ${voucher.expiryDate}\n상태: ${voucher.status === 'active' ? '활성' : '비활성'}`);
}

// 사용 내역 업데이트
function updateUsageHistory() {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;
    
    const history = JSON.parse(localStorage.getItem('usageHistory') || '[]');
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <span class="date">${item.date}</span>
            <span class="description">${item.description}</span>
            <span class="amount">-${item.amount.toLocaleString()}원</span>
        </div>
    `).join('');
}

// 스무스 스크롤 초기화
function initializeSmoothScroll() {
    // 네비게이션 링크에 스무스 스크롤 추가
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 섹션으로 스크롤하는 함수
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 헤더 스크롤 효과
function initializeHeaderScroll() {
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = '#fff';
            header.style.backdropFilter = 'none';
        }
        
        lastScrollTop = scrollTop;
    });
}

// 알림 표시 함수
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
        z-index: 10000;
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
    
    // CSS 애니메이션 추가
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// 페이지 로드 시 초기 데이터 설정
window.addEventListener('load', function() {
    // 사용 내역 업데이트
    updateUsageHistory();
    
    // 알림 목록 업데이트
    updateNotificationList();
});

// 알림 목록 업데이트
function updateNotificationList() {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    if (notifications.length === 0) {
        // 기본 알림 데이터
        const defaultNotifications = [
            {
                id: 1,
                type: 'success',
                title: '바우처 승인 완료',
                message: '교육 바우처 신청이 승인되었습니다.',
                time: '2시간 전',
                icon: 'fa-bell'
            },
            {
                id: 2,
                type: 'warning',
                title: '만료 예정 알림',
                message: '문화 바우처가 7일 후 만료됩니다.',
                time: '1일 전',
                icon: 'fa-exclamation-triangle'
            }
        ];
        localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
        displayNotifications(defaultNotifications);
    } else {
        displayNotifications(notifications);
    }
}

// 알림 표시
function displayNotifications(notifications) {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    notificationList.innerHTML = notifications.map(notification => `
        <div class="notification-item">
            <i class="fas ${notification.icon}"></i>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="time">${notification.time}</span>
            </div>
        </div>
    `).join('');
}

// 로그인 모달 (간단한 구현)
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>로그인</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginEmail">이메일</label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">비밀번호</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn-primary">로그인</button>
                <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">취소</button>
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
        max-width: 400px;
        width: 90%;
    `;
    
    document.body.appendChild(modal);
    
    // 로그인 폼 처리
    modal.querySelector('#loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('로그인 기능은 준비 중입니다.', 'info');
        modal.remove();
    });
}

// 로그인 버튼 이벤트 추가
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
});
