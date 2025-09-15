# 🚂 Railway 무료 배포 가이드

## 🎯 Railway 배포 단계별 가이드

### 1단계: Railway 계정 생성
1. **https://railway.app** 접속
2. **"Start a New Project"** 클릭
3. **GitHub 계정으로 로그인**
4. **"Deploy from GitHub repo"** 선택

### 2단계: 프로젝트 연결
1. **"saway126/voucher-platform"** 선택
2. **"Deploy Now"** 클릭
3. **자동 빌드 시작** (약 2-3분 소요)

### 3단계: 환경변수 설정
Railway 대시보드에서 다음 환경변수 추가:

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=voucher-platform-production-secret-key-2024
DATABASE_URL=sqlite:./database/voucher_platform.db
```

### 4단계: 데이터베이스 추가 (선택사항)
1. **"New" → "Database" → "PostgreSQL"** 선택
2. **자동으로 DATABASE_URL 생성됨**
3. **기존 환경변수에서 DATABASE_URL 업데이트**

### 5단계: 도메인 설정
1. **"Settings" → "Domains"** 이동
2. **커스텀 도메인 추가** (선택사항)
3. **기본 도메인**: `https://your-app-name.railway.app`

## 🚀 배포 완료 확인

### 배포된 URL 접속
```
https://your-app-name.railway.app
```

### API 테스트
```bash
# 프로그램 목록 조회
curl https://your-app-name.railway.app/api/programs

# 헬스 체크
curl https://your-app-name.railway.app/api/health
```

### 프론트엔드 테스트
1. **메인 페이지**: `https://your-app-name.railway.app`
2. **테스트 실행**: "🧪 테스트 실행" 버튼 클릭
3. **통합 테스트**: `https://your-app-name.railway.app/integration-test.html`

## 🔧 Railway 대시보드 기능

### 모니터링
- **실시간 로그** 확인
- **CPU/메모리 사용량** 모니터링
- **네트워크 트래픽** 확인

### 설정 관리
- **환경변수** 수정
- **도메인** 관리
- **자동 배포** 설정

### 확장성
- **수평 확장** (여러 인스턴스)
- **수직 확장** (리소스 증가)
- **로드 밸런싱** 자동 설정

## 💰 무료 제한사항

### Railway 무료 티어
- **500시간/월** 실행 시간
- **1GB RAM** 메모리
- **1GB 디스크** 공간
- **무제한** 배포
- **자동 HTTPS** 인증서

### 사용량 모니터링
- Railway 대시보드에서 실시간 사용량 확인
- 한도 초과 시 알림
- 필요시 유료 플랜으로 업그레이드

## 🛠️ 문제 해결

### 빌드 실패 시
```bash
# 로그 확인
railway logs

# 로컬에서 테스트
npm install
npm start
```

### 환경변수 문제
```bash
# Railway 대시보드에서 확인
# Settings → Variables
```

### 데이터베이스 연결 문제
```bash
# DATABASE_URL 확인
# PostgreSQL 서비스 상태 확인
```

## 🎉 배포 완료!

Railway 배포가 완료되면:

1. ✅ **무료 HTTPS 도메인** 제공
2. ✅ **자동 배포** (Git 푸시 시)
3. ✅ **실시간 모니터링**
4. ✅ **확장성** 지원
5. ✅ **전문적인 서비스** 운영

---

**바우처 사업 온라인 통합 플랫폼이 Railway에서 성공적으로 운영됩니다!** 🚂✨
