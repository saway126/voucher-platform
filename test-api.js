#!/usr/bin/env node

/**
 * API 테스트 스크립트
 * 백엔드 서버의 주요 API 엔드포인트를 테스트합니다.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// 테스트 결과 저장
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// HTTP 요청 헬퍼 함수
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: jsonBody
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// 테스트 실행 함수
async function runTest(testName, testFunction) {
    try {
        console.log(`⏳ ${testName} 테스트 중...`);
        await testFunction();
        console.log(`✅ ${testName} 통과`);
        testResults.passed++;
        testResults.tests.push({ name: testName, status: 'pass' });
    } catch (error) {
        console.log(`❌ ${testName} 실패: ${error.message}`);
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'fail', error: error.message });
    }
}

// 서버 연결 테스트
async function testServerConnection() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET'
    };
    
    const response = await makeRequest(options);
    if (response.statusCode !== 200) {
        throw new Error(`서버 응답 코드: ${response.statusCode}`);
    }
}

// 인증 API 테스트
async function testAuthAPI() {
    // 회원가입 테스트
    const registerOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const registerData = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: '테스트 사용자',
        role: 'applicant'
    };
    
    const registerResponse = await makeRequest(registerOptions, registerData);
    if (registerResponse.statusCode !== 201 && registerResponse.statusCode !== 400) {
        throw new Error(`회원가입 API 응답 코드: ${registerResponse.statusCode}`);
    }
    
    // 로그인 테스트
    const loginOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    if (loginResponse.statusCode !== 200) {
        throw new Error(`로그인 API 응답 코드: ${loginResponse.statusCode}`);
    }
}

// 프로그램 API 테스트
async function testProgramsAPI() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/programs',
        method: 'GET'
    };
    
    const response = await makeRequest(options);
    if (response.statusCode !== 200) {
        throw new Error(`프로그램 API 응답 코드: ${response.statusCode}`);
    }
}

// 신청서 API 테스트
async function testApplicationsAPI() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/applications',
        method: 'GET'
    };
    
    const response = await makeRequest(options);
    if (response.statusCode !== 200) {
        throw new Error(`신청서 API 응답 코드: ${response.statusCode}`);
    }
}

// 바우처 API 테스트
async function testVouchersAPI() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/vouchers',
        method: 'GET'
    };
    
    const response = await makeRequest(options);
    if (response.statusCode !== 200) {
        throw new Error(`바우처 API 응답 코드: ${response.statusCode}`);
    }
}

// 알림 API 테스트
async function testNotificationsAPI() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/notifications',
        method: 'GET'
    };
    
    const response = await makeRequest(options);
    if (response.statusCode !== 200) {
        throw new Error(`알림 API 응답 코드: ${response.statusCode}`);
    }
}

// 메인 테스트 실행 함수
async function runAllTests() {
    console.log('🧪 바우처 사업 온라인 통합 플랫폼 API 테스트 시작...\n');
    
    await runTest('서버 연결', testServerConnection);
    await runTest('인증 API', testAuthAPI);
    await runTest('프로그램 API', testProgramsAPI);
    await runTest('신청서 API', testApplicationsAPI);
    await runTest('바우처 API', testVouchersAPI);
    await runTest('알림 API', testNotificationsAPI);
    
    console.log('\n📊 테스트 결과 요약');
    console.log('==================================================');
    console.log(`총 테스트: ${testResults.passed + testResults.failed}`);
    console.log(`✅ 통과: ${testResults.passed}`);
    console.log(`❌ 실패: ${testResults.failed}`);
    console.log(`성공률: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ 실패한 테스트:');
        testResults.tests
            .filter(test => test.status === 'fail')
            .forEach(test => console.log(`  - ${test.name}: ${test.error}`));
    }
    
    console.log('\n✅ 통과한 테스트:');
    testResults.tests
        .filter(test => test.status === 'pass')
        .forEach(test => console.log(`  - ${test.name}`));
    
    console.log('\n🎉 API 테스트 완료!');
    
    if (testResults.failed === 0) {
        console.log('🎊 모든 API 테스트가 통과했습니다!');
    } else {
        console.log('⚠️ 일부 API 테스트가 실패했습니다. 위의 실패 목록을 확인해주세요.');
    }
}

// 테스트 실행
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests };
