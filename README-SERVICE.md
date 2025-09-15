# 🚀 바우처 사업 온라인 통합 플랫폼 - 실제 서비스 버전

## 📋 개요

기획안 v1.0을 기반으로 한 완전한 바우처 사업 온라인 통합 플랫폼입니다. 실제 서비스 운영이 가능한 백엔드 API 서버와 데이터베이스가 포함되어 있습니다.

## ✨ 주요 기능

### ✅ 완전 구현된 기능
- **실제 데이터베이스**: SQLite 기반 완전한 데이터 모델
- **백엔드 API 서버**: Node.js/Express 기반 RESTful API
- **인증 시스템**: JWT 기반 보안 인증
- **사업 관리**: CRUD 기능 완비
- **신청서 관리**: 제출, 심사, 배분 전체 프로세스
- **바우처 발급**: 코드 생성, 사용 내역 관리
- **알림 시스템**: 템플릿 기반 알림 발송
- **파일 관리**: 업로드/다운로드 시스템
- **관리자 대시보드**: 통계 및 감사 로그
- **보안 기능**: 암호화, 권한 관리, 감사 추적

### 🔧 부분 구현된 기능
- **본인인증**: API 연동 준비 완료 (실제 연동 필요)
- **결제/지급대행**: API 연동 준비 완료 (실제 연동 필요)
- **알림톡 발송**: API 연동 준비 완료 (실제 연동 필요)

## 🛠️ 기술 스택

### 백엔드
- **Node.js 18+**
- **Express.js** - 웹 프레임워크
- **SQLite** - 데이터베이스
- **JWT** - 인증 토큰
- **bcryptjs** - 비밀번호 암호화
- **Multer** - 파일 업로드
- **Helmet** - 보안 헤더
- **CORS** - 크로스 오리진 설정

### 프론트엔드
- **HTML5/CSS3/JavaScript**
- **반응형 디자인**
- **API 클라이언트** - 백엔드 연동

### 배포
- **Docker** - 컨테이너화
- **Docker Compose** - 다중 서비스 관리
- **Nginx** - 리버스 프록시

## 🚀 설치 및 실행

### 1. 개발 환경에서 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일을 편집하여 필요한 설정을 입력하세요

# 서버 실행
npm start

# 개발 모드 (nodemon 사용)
npm run dev
```

### 2. Docker로 실행

```bash
# Docker 이미지 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f voucher-platform

# 서비스 중지
docker-compose down
```

### 3. 프로덕션 배포

```bash
# 환경 변수 설정
export JWT_SECRET="your-super-secret-jwt-key"
export NODE_ENV="production"

# Docker로 배포
docker-compose -f docker-compose.yml up -d
```

## 📡 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/verify` - 토큰 검증
- `POST /api/auth/change-password` - 비밀번호 변경

### 사업 관리
- `GET /api/programs` - 사업 목록 조회
- `GET /api/programs/:id` - 사업 상세 조회
- `POST /api/programs` - 사업 생성 (관리자)
- `PUT /api/programs/:id` - 사업 수정 (관리자)
- `DELETE /api/programs/:id` - 사업 삭제 (관리자)

### 신청서 관리
- `POST /api/applications` - 신청서 제출
- `GET /api/applications/my` - 내 신청서 목록
- `GET /api/applications/:id` - 신청서 상세 조회
- `PUT /api/applications/:id/status` - 신청서 상태 변경 (관리자)

### 바우처 관리
- `POST /api/vouchers` - 바우처 발급 (관리자)
- `GET /api/vouchers/my` - 내 바우처 목록
- `POST /api/vouchers/:id/use` - 바우처 사용

### 파일 관리
- `POST /api/files/upload` - 파일 업로드
- `GET /api/files/my` - 내 파일 목록
- `GET /api/files/:id/download` - 파일 다운로드

### 관리자 기능
- `GET /api/admin/dashboard` - 대시보드 통계
- `GET /api/admin/audit-logs` - 감사 로그 조회

## 🔐 보안 기능

### 인증 및 권한
- JWT 기반 토큰 인증
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 bcrypt 암호화
- 세션 관리

### 보안 헤더
- Helmet.js로 보안 헤더 설정
- CORS 정책 적용
- Rate Limiting 적용
- XSS 및 CSRF 방지

### 감사 추적
- 모든 주요 행위 로깅
- IP 주소 및 User-Agent 기록
- 변경 이력 추적

## 📊 데이터베이스 스키마

### 주요 테이블
- `users` - 사용자 정보
- `programs` - 사업 정보
- `applications` - 신청서
- `reviews` - 심사 결과
- `allocations` - 배분 결과
- `vouchers` - 바우처 정보
- `notifications` - 알림
- `files` - 파일 정보
- `audit_logs` - 감사 로그

## 🔧 외부 연동 설정

### 본인인증 (PASS)
```javascript
// .env 파일에 추가
PASS_API_KEY=your-pass-api-key
PASS_API_URL=https://api.pass.co.kr/
```

### 결제 (토스페이먼츠)
```javascript
// .env 파일에 추가
TOSS_API_KEY=your-toss-api-key
TOSS_SECRET_KEY=your-toss-secret-key
```

### 알림톡 (카카오 비즈메시지)
```javascript
// .env 파일에 추가
KAKAO_API_KEY=your-kakao-api-key
KAKAO_TEMPLATE_ID=your-template-id
```

### 이메일 (SMTP)
```javascript
// .env 파일에 추가
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📈 모니터링 및 로깅

### 로그 파일
- `./logs/app.log` - 애플리케이션 로그
- `./logs/error.log` - 에러 로그
- `./logs/access.log` - 접근 로그

### 헬스체크
- Docker 헬스체크 설정
- API 엔드포인트 상태 확인
- 데이터베이스 연결 상태 확인

## 🚀 배포 가이드

### 1. 클라우드 배포 (AWS/GCP/Azure)
```bash
# Docker 이미지 빌드
docker build -t voucher-platform .

# 클라우드 레지스트리에 푸시
docker tag voucher-platform your-registry/voucher-platform:latest
docker push your-registry/voucher-platform:latest

# 클라우드에서 배포
# (각 클라우드 제공업체의 배포 방법 참조)
```

### 2. 로컬 서버 배포
```bash
# 서버에 코드 업로드
scp -r . user@server:/opt/voucher-platform/

# 서버에서 실행
ssh user@server
cd /opt/voucher-platform
docker-compose up -d
```

## 🔍 테스트

### API 테스트
```bash
# 서버 실행 후 테스트
curl -X GET http://localhost:3000/api/programs
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"테스트","type":"individual"}'
```

### 프론트엔드 테스트
1. 브라우저에서 `http://localhost:3000` 접속
2. 회원가입/로그인 테스트
3. 사업 신청 테스트
4. 관리자 기능 테스트

## 📞 지원 및 문의

### 기술 지원
- 이슈 리포트: GitHub Issues
- 문서: README 파일 참조
- 로그 확인: `./logs/` 디렉토리

### 운영 가이드
- 정기 백업: 데이터베이스 파일 백업
- 모니터링: 로그 파일 및 서버 상태 확인
- 업데이트: 의존성 패키지 정기 업데이트

## 🎯 다음 단계

### 추가 구현 필요 사항
1. **실제 외부 API 연동**
   - PASS 본인인증 연동
   - 토스페이먼츠 결제 연동
   - 카카오 알림톡 발송 연동

2. **고도화 기능**
   - 다국어 지원
   - 접근성 개선
   - 성능 최적화

3. **운영 도구**
   - 관리자 대시보드 고도화
   - 자동화 스크립트
   - 백업/복원 도구

---

**🎉 축하합니다! 실제 서비스 운영이 가능한 바우처 플랫폼이 완성되었습니다!**
