#!/usr/bin/env node

/**
 * 성능 테스트 스크립트
 * 서버의 응답 시간, 메모리 사용량, 동시 접속 등을 테스트합니다.
 */

const http = require('http');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// 성능 테스트 결과
const performanceResults = {
    responseTimes: [],
    memoryUsage: [],
    concurrentTests: [],
    loadTests: []
};

// HTTP 요청 헬퍼 함수
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: jsonBody,
                        responseTime: responseTime
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        responseTime: responseTime
                    });
                }
            });
        });

        req.on('error', (error) => {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            reject({ error, responseTime });
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// 응답 시간 테스트
async function testResponseTime() {
    console.log('⏳ 응답 시간 테스트 중...');
    
    const endpoints = [
        { path: '/api/programs', method: 'GET' },
        { path: '/api/applications', method: 'GET' },
        { path: '/api/vouchers', method: 'GET' },
        { path: '/api/notifications', method: 'GET' }
    ];
    
    for (const endpoint of endpoints) {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint.path,
            method: endpoint.method
        };
        
        try {
            const response = await makeRequest(options);
            performanceResults.responseTimes.push({
                endpoint: endpoint.path,
                method: endpoint.method,
                responseTime: response.responseTime,
                statusCode: response.statusCode
            });
            
            console.log(`  ✅ ${endpoint.path}: ${response.responseTime.toFixed(2)}ms (${response.statusCode})`);
        } catch (error) {
            console.log(`  ❌ ${endpoint.path}: 오류 - ${error.error.message}`);
        }
    }
}

// 동시 요청 테스트
async function testConcurrentRequests() {
    console.log('⏳ 동시 요청 테스트 중...');
    
    const concurrentRequests = 10;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/programs',
            method: 'GET'
        };
        
        promises.push(makeRequest(options));
    }
    
    try {
        const startTime = performance.now();
        const responses = await Promise.all(promises);
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        const successCount = responses.filter(r => r.statusCode === 200).length;
        const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
        
        performanceResults.concurrentTests.push({
            concurrentRequests,
            totalTime,
            successCount,
            avgResponseTime,
            successRate: (successCount / concurrentRequests) * 100
        });
        
        console.log(`  ✅ 동시 ${concurrentRequests}개 요청: ${totalTime.toFixed(2)}ms`);
        console.log(`  ✅ 성공률: ${successCount}/${concurrentRequests} (${((successCount/concurrentRequests)*100).toFixed(1)}%)`);
        console.log(`  ✅ 평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`);
        
    } catch (error) {
        console.log(`  ❌ 동시 요청 테스트 실패: ${error.error.message}`);
    }
}

// 부하 테스트
async function testLoad() {
    console.log('⏳ 부하 테스트 중...');
    
    const loadLevels = [5, 10, 20, 50];
    
    for (const load of loadLevels) {
        console.log(`  📊 부하 레벨 ${load} 테스트 중...`);
        
        const promises = [];
        const startTime = performance.now();
        
        for (let i = 0; i < load; i++) {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: '/api/programs',
                method: 'GET'
            };
            
            promises.push(makeRequest(options));
        }
        
        try {
            const responses = await Promise.all(promises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            const successCount = responses.filter(r => r.statusCode === 200).length;
            const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
            
            performanceResults.loadTests.push({
                loadLevel: load,
                totalTime,
                successCount,
                avgResponseTime,
                successRate: (successCount / load) * 100,
                requestsPerSecond: (load / totalTime) * 1000
            });
            
            console.log(`    ✅ ${load}개 요청 완료: ${totalTime.toFixed(2)}ms`);
            console.log(`    ✅ 성공률: ${successCount}/${load} (${((successCount/load)*100).toFixed(1)}%)`);
            console.log(`    ✅ RPS: ${((load / totalTime) * 1000).toFixed(2)}`);
            
        } catch (error) {
            console.log(`    ❌ 부하 레벨 ${load} 테스트 실패: ${error.error.message}`);
        }
        
        // 다음 테스트 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// 메모리 사용량 테스트
function testMemoryUsage() {
    console.log('⏳ 메모리 사용량 테스트 중...');
    
    const memBefore = process.memoryUsage();
    
    // 메모리 집약적인 작업 시뮬레이션
    const largeArray = [];
    for (let i = 0; i < 10000; i++) {
        largeArray.push({
            id: i,
            data: 'test data '.repeat(100),
            timestamp: Date.now()
        });
    }
    
    const memAfter = process.memoryUsage();
    
    performanceResults.memoryUsage.push({
        before: {
            rss: memBefore.rss,
            heapUsed: memBefore.heapUsed,
            heapTotal: memBefore.heapTotal,
            external: memBefore.external
        },
        after: {
            rss: memAfter.rss,
            heapUsed: memAfter.heapUsed,
            heapTotal: memAfter.heapTotal,
            external: memAfter.external
        },
        difference: {
            rss: memAfter.rss - memBefore.rss,
            heapUsed: memAfter.heapUsed - memBefore.heapUsed,
            heapTotal: memAfter.heapTotal - memBefore.heapTotal,
            external: memAfter.external - memBefore.external
        }
    });
    
    console.log(`  ✅ 메모리 사용량 변화:`);
    console.log(`    RSS: ${(performanceResults.memoryUsage[0].difference.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`    Heap Used: ${(performanceResults.memoryUsage[0].difference.heapUsed / 1024 / 1024).toFixed(2)}MB`);
}

// 성능 테스트 결과 요약
function printPerformanceSummary() {
    console.log('\n📊 성능 테스트 결과 요약');
    console.log('==================================================');
    
    // 응답 시간 요약
    if (performanceResults.responseTimes.length > 0) {
        const avgResponseTime = performanceResults.responseTimes.reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.responseTimes.length;
        const maxResponseTime = Math.max(...performanceResults.responseTimes.map(r => r.responseTime));
        const minResponseTime = Math.min(...performanceResults.responseTimes.map(r => r.responseTime));
        
        console.log(`\n⏱️ 응답 시간:`);
        console.log(`  평균: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`  최대: ${maxResponseTime.toFixed(2)}ms`);
        console.log(`  최소: ${minResponseTime.toFixed(2)}ms`);
    }
    
    // 동시 요청 요약
    if (performanceResults.concurrentTests.length > 0) {
        const test = performanceResults.concurrentTests[0];
        console.log(`\n🔄 동시 요청 (${test.concurrentRequests}개):`);
        console.log(`  총 시간: ${test.totalTime.toFixed(2)}ms`);
        console.log(`  성공률: ${test.successRate.toFixed(1)}%`);
        console.log(`  평균 응답 시간: ${test.avgResponseTime.toFixed(2)}ms`);
    }
    
    // 부하 테스트 요약
    if (performanceResults.loadTests.length > 0) {
        console.log(`\n📈 부하 테스트:`);
        performanceResults.loadTests.forEach(test => {
            console.log(`  ${test.loadLevel}개 요청: ${test.totalTime.toFixed(2)}ms, 성공률 ${test.successRate.toFixed(1)}%, RPS ${test.requestsPerSecond.toFixed(2)}`);
        });
    }
    
    // 메모리 사용량 요약
    if (performanceResults.memoryUsage.length > 0) {
        const mem = performanceResults.memoryUsage[0];
        console.log(`\n💾 메모리 사용량:`);
        console.log(`  RSS 변화: ${(mem.difference.rss / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Heap Used 변화: ${(mem.difference.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.log('\n🎉 성능 테스트 완료!');
}

// 메인 테스트 실행 함수
async function runPerformanceTests() {
    console.log('🚀 바우처 사업 온라인 통합 플랫폼 성능 테스트 시작...\n');
    
    try {
        await testResponseTime();
        console.log('');
        
        await testConcurrentRequests();
        console.log('');
        
        await testLoad();
        console.log('');
        
        testMemoryUsage();
        console.log('');
        
        printPerformanceSummary();
        
    } catch (error) {
        console.error('❌ 성능 테스트 중 오류 발생:', error);
    }
}

// 테스트 실행
if (require.main === module) {
    runPerformanceTests().catch(console.error);
}

module.exports = { runPerformanceTests };
