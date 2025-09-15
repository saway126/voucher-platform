# 🚀 GitHub Actions CI/CD 설정 가이드

## 📋 설정 단계

### 1단계: Railway 토큰 생성
1. **Railway 대시보드** 접속: https://railway.app/dashboard
2. **Settings** → **Tokens** 이동
3. **Generate Token** 클릭
4. **토큰 이름**: `github-actions-deploy`
5. **토큰 복사** (한 번만 표시됨)

### 2단계: GitHub Secrets 설정
1. **GitHub 저장소** 접속: https://github.com/saway126/voucher-platform
2. **Settings** 탭 클릭
3. **Secrets and variables** → **Actions** 클릭
4. **New repository secret** 클릭
5. **Name**: `RAILWAY_TOKEN`
6. **Secret**: Railway에서 복사한 토큰
7. **Add secret** 클릭

### 3단계: 워크플로우 활성화
1. **Actions** 탭 클릭
2. **CI/CD Pipeline** 워크플로우 선택
3. **Enable workflow** 클릭

## 🔄 자동화 프로세스

### 코드 푸시 시 자동 실행:
1. **테스트 실행** (Node.js 18.x, 20.x)
2. **보안 스캔** (CodeQL)
3. **자동 배포** (Railway)

### Pull Request 시:
1. **테스트 실행**
2. **보안 스캔**
3. **배포 없음** (검토 후 수동 배포)

## 📊 워크플로우 구성

### Test Job
- **Node.js 버전**: 18.x, 20.x
- **테스트**: Jest + Supertest
- **린팅**: ESLint (선택사항)
- **빌드**: 프론트엔드 빌드

### Security Scan Job
- **CodeQL**: JavaScript 보안 분석
- **취약점 감지**: 자동 스캔

### Deploy Job
- **조건**: main 브랜치 푸시 시만
- **Railway 배포**: 자동 배포
- **서비스**: voucher-platform

## 🛠️ 테스트 명령어

```bash
# 모든 테스트 실행
npm test

# 테스트 커버리지 포함
npm run test

# API 테스트
npm run test:api

# 성능 테스트
npm run test:performance

# 보안 테스트
npm run test:security
```

## 📈 모니터링

### GitHub Actions 대시보드
- **실행 상태**: 성공/실패 확인
- **테스트 결과**: 커버리지 리포트
- **보안 스캔**: 취약점 리포트
- **배포 로그**: Railway 배포 상태

### Railway 대시보드
- **배포 상태**: 자동 배포 확인
- **서버 로그**: 실시간 모니터링
- **성능 메트릭**: CPU/메모리 사용량

## 🎯 장점

### 개발 효율성
- ✅ **자동 테스트**: 코드 품질 보장
- ✅ **자동 배포**: 수동 작업 제거
- ✅ **보안 스캔**: 취약점 조기 발견
- ✅ **롤백**: 문제 시 이전 버전 복구

### 팀 협업
- ✅ **Pull Request**: 코드 리뷰 필수
- ✅ **브랜치 보호**: main 브랜치 보호
- ✅ **상태 체크**: 배포 전 검증
- ✅ **알림**: 실패 시 즉시 알림

## 🔧 문제 해결

### 테스트 실패 시
```bash
# 로컬에서 테스트 실행
npm test

# 특정 테스트만 실행
npm test -- --testNamePattern="Server Tests"
```

### 배포 실패 시
1. **Railway 토큰** 확인
2. **GitHub Secrets** 확인
3. **워크플로우 로그** 확인
4. **Railway 대시보드** 확인

---

**GitHub Actions 설정이 완료되면 코드를 푸시할 때마다 자동으로 테스트하고 배포됩니다!** 🎉
