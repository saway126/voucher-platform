// API 클라이언트 - 백엔드 API와 통신
class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
    }

    // 토큰 설정
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // HTTP 요청 헬퍼
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // 인증 토큰 추가
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '요청이 실패했습니다.');
            }

            return data;
        } catch (error) {
            console.error('API 요청 오류:', error);
            throw error;
        }
    }

    // GET 요청
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST 요청
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT 요청
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE 요청
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // 파일 업로드
    async uploadFile(file, endpoint = '/files/upload') {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'POST',
            body: formData,
            headers: {}
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '파일 업로드가 실패했습니다.');
            }

            return data;
        } catch (error) {
            console.error('파일 업로드 오류:', error);
            throw error;
        }
    }

    // === 인증 관련 API ===
    async register(userData) {
        const response = await this.post('/auth/register', userData);
        if (response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        if (response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } finally {
            this.setToken(null);
        }
    }

    async verifyToken() {
        return this.get('/auth/verify');
    }

    async changePassword(currentPassword, newPassword) {
        return this.post('/auth/change-password', { currentPassword, newPassword });
    }

    // === 사업 관련 API ===
    async getPrograms(params = {}) {
        return this.get('/programs', params);
    }

    async getProgram(id) {
        return this.get(`/programs/${id}`);
    }

    async createProgram(programData) {
        return this.post('/programs', programData);
    }

    async updateProgram(id, programData) {
        return this.put(`/programs/${id}`, programData);
    }

    async deleteProgram(id) {
        return this.delete(`/programs/${id}`);
    }

    // === 신청서 관련 API ===
    async submitApplication(applicationData) {
        return this.post('/applications', applicationData);
    }

    async getMyApplications(params = {}) {
        return this.get('/applications/my', params);
    }

    async getApplication(id) {
        return this.get(`/applications/${id}`);
    }

    async updateApplicationStatus(id, status, notes) {
        return this.put(`/applications/${id}/status`, { status, notes });
    }

    // === 신청자 관련 API ===
    async getApplicants(params = {}) {
        return this.get('/applicants', params);
    }

    async getApplicant(id) {
        return this.get(`/applicants/${id}`);
    }

    // === 심사 관련 API ===
    async submitReview(reviewData) {
        return this.post('/reviews', reviewData);
    }

    async getMyReviews(params = {}) {
        return this.get('/reviews/my', params);
    }

    // === 배분 관련 API ===
    async simulateAllocation(programId, rules) {
        return this.post('/allocations/simulate', { programId, rules });
    }

    async confirmAllocation(id) {
        return this.post(`/allocations/${id}/confirm`);
    }

    // === 바우처 관련 API ===
    async issueVoucher(voucherData) {
        return this.post('/vouchers', voucherData);
    }

    async getMyVouchers(params = {}) {
        return this.get('/vouchers/my', params);
    }

    async useVoucher(id, amount, merchantName) {
        return this.post(`/vouchers/${id}/use`, { amount, merchantName });
    }

    // === 알림 관련 API ===
    async sendNotification(notificationData) {
        return this.post('/notifications/send', notificationData);
    }

    async getMyNotifications(params = {}) {
        return this.get('/notifications/my', params);
    }

    // === 파일 관련 API ===
    async uploadFile(file) {
        return this.uploadFile(file);
    }

    async getMyFiles(params = {}) {
        return this.get('/files/my', params);
    }

    async downloadFile(id) {
        const url = `${this.baseURL}/files/${id}/download`;
        const config = {
            headers: {}
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error('파일 다운로드가 실패했습니다.');
            }
            return response.blob();
        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            throw error;
        }
    }

    // === 관리자 관련 API ===
    async getDashboard() {
        return this.get('/admin/dashboard');
    }

    async getAuditLogs(params = {}) {
        return this.get('/admin/audit-logs', params);
    }
}

// 전역 API 클라이언트 인스턴스
window.apiClient = new ApiClient();

// 기존 데이터 모델을 API 클라이언트로 대체하는 래퍼
window.apiDataModel = {
    // 인증 관련
    async login(email, password) {
        try {
            const response = await window.apiClient.login(email, password);
            return response.data.user;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async register(userData) {
        try {
            const response = await window.apiClient.register(userData);
            return response.data.user;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async logout() {
        try {
            await window.apiClient.logout();
        } catch (error) {
            console.error('로그아웃 오류:', error);
        }
    },

    // 사업 관련
    async getPrograms(params = {}) {
        try {
            const response = await window.apiClient.getPrograms(params);
            return response.data.programs;
        } catch (error) {
            console.error('사업 조회 오류:', error);
            return [];
        }
    },

    async createProgram(programData) {
        try {
            const response = await window.apiClient.createProgram(programData);
            return { id: response.data.id, ...programData };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // 신청서 관련
    async submitApplication(applicationData) {
        try {
            const response = await window.apiClient.submitApplication(applicationData);
            return {
                id: response.data.applicationId,
                applicationNumber: response.data.applicationNumber,
                ...applicationData
            };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getMyApplications(params = {}) {
        try {
            const response = await window.apiClient.getMyApplications(params);
            return response.data.applications;
        } catch (error) {
            console.error('신청서 조회 오류:', error);
            return [];
        }
    },

    // 바우처 관련
    async getMyVouchers(params = {}) {
        try {
            const response = await window.apiClient.getMyVouchers(params);
            return response.data.vouchers;
        } catch (error) {
            console.error('바우처 조회 오류:', error);
            return [];
        }
    },

    async useVoucher(voucherId, amount, merchantName) {
        try {
            const response = await window.apiClient.useVoucher(voucherId, amount, merchantName);
            return response.data;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // 알림 관련
    async getMyNotifications(params = {}) {
        try {
            const response = await window.apiClient.getMyNotifications(params);
            return response.data.notifications;
        } catch (error) {
            console.error('알림 조회 오류:', error);
            return [];
        }
    },

    // 관리자 관련
    async getDashboard() {
        try {
            const response = await window.apiClient.getDashboard();
            return response.data;
        } catch (error) {
            console.error('대시보드 조회 오류:', error);
            return {
                stats: { activePrograms: 0, totalApplicants: 0, activeVouchers: 0, usedVouchers: 0 },
                recentApplications: [],
                recentVouchers: []
            };
        }
    }
};

console.log('✅ API 클라이언트가 로드되었습니다.');
