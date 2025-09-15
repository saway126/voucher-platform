#!/usr/bin/env node

/**
 * 보안 테스트 스크립트
 * 인증, 권한, 데이터 보호, SQL 인젝션 등을 테스트합니다.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// 보안 테스트 결과
const securityResults = {
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
async function runSecurityTest(testName, testFunction) {
    try {
        console.log(`⏳ ${testName} 테스트 중...`);
        await testFunction();
        console.log(`✅ ${testName} 통과`);
        securityResults.passed++;
        securityResults.tests.push({ name: testName, status: 'pass' });
    } catch (error) {
        console.log(`❌ ${testName} 실패: ${error.message}`);
        securityResults.failed++;
        securityResults.tests.push({ name: testName, status: 'fail', error: error.message });
    }
}

// 인증 없이 접근 시도 테스트
async function testUnauthorizedAccess() {
    const protectedEndpoints = [
        '/api/applications',
        '/api/vouchers',
        '/api/admin/users',
        '/api/admin/programs'
    ];
    
    for (const endpoint of protectedEndpoints) {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint,
            method: 'GET'
        };
        
        const response = await makeRequest(options);
        
        // 인증이 필요한 엔드포인트는 401 또는 403을 반환해야 함
        if (response.statusCode !== 401 && response.statusCode !== 403) {
            throw new Error(`${endpoint}가 인증 없이 접근 가능합니다 (상태 코드: ${response.statusCode})`);
        }
    }
}

// 잘못된 토큰으로 접근 시도 테스트
async function testInvalidToken() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/applications',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer invalid-token-12345'
        }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode !== 401) {
        throw new Error(`잘못된 토큰이 허용되었습니다 (상태 코드: ${response.statusCode})`);
    }
}

// 만료된 토큰 테스트
async function testExpiredToken() {
    // 만료된 JWT 토큰 생성 (exp: 0)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1NjAwMCwiZXhwIjowfQ.invalid';
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/applications',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${expiredToken}`
        }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode !== 401) {
        throw new Error(`만료된 토큰이 허용되었습니다 (상태 코드: ${response.statusCode})`);
    }
}

// SQL 인젝션 테스트
async function testSQLInjection() {
    const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email, password) VALUES ('hacker@evil.com', 'password'); --",
        "1' UNION SELECT * FROM users --"
    ];
    
    for (const maliciousInput of maliciousInputs) {
        // 로그인 시도
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
            email: maliciousInput,
            password: maliciousInput
        };
        
        const response = await makeRequest(loginOptions, loginData);
        
        // SQL 인젝션이 성공했다면 예상치 못한 응답이 올 수 있음
        if (response.statusCode === 200 && response.body.success) {
            throw new Error(`SQL 인젝션 취약점 발견: ${maliciousInput}`);
        }
    }
}

// XSS 테스트
async function testXSS() {
    const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">'
    ];
    
    for (const payload of xssPayloads) {
        // 회원가입 시도
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
            email: `test+${payload}@example.com`,
            password: 'testpassword123',
            name: payload,
            type: 'individual'
        };
        
        const response = await makeRequest(registerOptions, registerData);
        
        // 응답에 스크립트가 그대로 포함되어 있다면 XSS 취약점
        if (response.body && JSON.stringify(response.body).includes(payload)) {
            throw new Error(`XSS 취약점 발견: ${payload}`);
        }
    }
}

// Rate Limiting 테스트
async function testRateLimiting() {
    const options = {
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
        password: 'wrongpassword'
    };
    
    // 빠른 연속 요청 시도
    const requests = [];
    for (let i = 0; i < 150; i++) { // Rate limit은 100개
        requests.push(makeRequest(options, loginData));
    }
    
    const responses = await Promise.all(requests);
    
    // 일부 요청이 429 (Too Many Requests)를 반환해야 함
    const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
    
    if (rateLimitedResponses.length === 0) {
        throw new Error('Rate limiting이 작동하지 않습니다');
    }
}

// CORS 테스트
async function testCORS() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/programs',
        method: 'GET',
        headers: {
            'Origin': 'https://malicious-site.com',
            'Access-Control-Request-Method': 'GET'
        }
    };
    
    const response = await makeRequest(options);
    
    // CORS 헤더가 적절히 설정되어 있는지 확인
    const corsHeaders = response.headers['access-control-allow-origin'];
    
    if (corsHeaders && corsHeaders === '*') {
        throw new Error('CORS가 모든 도메인을 허용하고 있습니다');
    }
}

// 보안 헤더 테스트
async function testSecurityHeaders() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/programs',
        method: 'GET'
    };
    
    const response = await makeRequest(options);
    
    const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security'
    ];
    
    const missingHeaders = securityHeaders.filter(header => !response.headers[header]);
    
    if (missingHeaders.length > 0) {
        throw new Error(`보안 헤더가 누락되었습니다: ${missingHeaders.join(', ')}`);
    }
}

// 데이터 검증 테스트
async function testDataValidation() {
    const invalidData = [
        { email: 'invalid-email', password: '123', name: '', type: 'invalid' },
        { email: '', password: '', name: 'a', type: 'individual' },
        { email: 'test@example.com', password: '123', name: 'Test User', type: 'individual' }
    ];
    
    for (const data of invalidData) {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const response = await makeRequest(options, data);
        
        // 잘못된 데이터는 400 Bad Request를 반환해야 함
        if (response.statusCode !== 400) {
            throw new Error(`데이터 검증이 실패했습니다: ${JSON.stringify(data)}`);
        }
    }
}

// 메인 보안 테스트 실행 함수
async function runSecurityTests() {
    console.log('🔒 바우처 사업 온라인 통합 플랫폼 보안 테스트 시작...\n');
    
    await runSecurityTest('인증 없이 접근 시도', testUnauthorizedAccess);
    await runSecurityTest('잘못된 토큰 테스트', testInvalidToken);
    await runSecurityTest('만료된 토큰 테스트', testExpiredToken);
    await runSecurityTest('SQL 인젝션 테스트', testSQLInjection);
    await runSecurityTest('XSS 테스트', testXSS);
    await runSecurityTest('Rate Limiting 테스트', testRateLimiting);
    await runSecurityTest('CORS 테스트', testCORS);
    await runSecurityTest('보안 헤더 테스트', testSecurityHeaders);
    await runSecurityTest('데이터 검증 테스트', testDataValidation);
    
    console.log('\n📊 보안 테스트 결과 요약');
    console.log('==================================================');
    console.log(`총 테스트: ${securityResults.passed + securityResults.failed}`);
    console.log(`✅ 통과: ${securityResults.passed}`);
    console.log(`❌ 실패: ${securityResults.failed}`);
    console.log(`성공률: ${((securityResults.passed / (securityResults.passed + securityResults.failed)) * 100).toFixed(1)}%`);
    
    if (securityResults.failed > 0) {
        console.log('\n❌ 실패한 테스트:');
        securityResults.tests
            .filter(test => test.status === 'fail')
            .forEach(test => console.log(`  - ${test.name}: ${test.error}`));
    }
    
    console.log('\n✅ 통과한 테스트:');
    securityResults.tests
        .filter(test => test.status === 'pass')
        .forEach(test => console.log(`  - ${test.name}`));
    
    console.log('\n🎉 보안 테스트 완료!');
    
    if (securityResults.failed === 0) {
        console.log('🎊 모든 보안 테스트가 통과했습니다!');
    } else {
        console.log('⚠️ 일부 보안 테스트가 실패했습니다. 위의 실패 목록을 확인해주세요.');
    }
}

// 테스트 실행
if (require.main === module) {
    runSecurityTests().catch(console.error);
}

module.exports = { runSecurityTests };
