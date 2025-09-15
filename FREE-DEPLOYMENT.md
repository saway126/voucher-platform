# 🆓 바우처 사업 온라인 통합 플랫폼 무료 배포 가이드

## 🎯 무료 배포 옵션들

### 1. 🚀 **Vercel (추천)**
**가장 간단하고 빠른 배포**

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 배포
vercel

# 3. 환경변수 설정
vercel env add JWT_SECRET
vercel env add DATABASE_URL
```

**장점:**
- ✅ 완전 무료
- ✅ 자동 HTTPS
- ✅ 글로벌 CDN
- ✅ 자동 배포 (Git 연동)
- ✅ 커스텀 도메인 지원

**제한사항:**
- 서버리스 함수 제한 (100GB/월)
- 실행 시간 제한 (10초)

---

### 2. 🌐 **Netlify**
**프론트엔드 중심 배포**

```bash
# 1. Netlify CLI 설치
npm i -g netlify-cli

# 2. 빌드 및 배포
netlify build
netlify deploy --prod
```

**장점:**
- ✅ 완전 무료
- ✅ 자동 HTTPS
- ✅ 폼 처리 기능
- ✅ 서버리스 함수 지원

---

### 3. 🐳 **Railway**
**풀스택 앱 배포 (추천)**

```bash
# 1. Railway CLI 설치
npm i -g @railway/cli

# 2. 로그인 및 배포
railway login
railway init
railway up
```

**장점:**
- ✅ 무료 티어 제공
- ✅ 데이터베이스 포함
- ✅ 자동 HTTPS
- ✅ Git 연동

**무료 제한:**
- 500시간/월 실행
- 1GB RAM
- 1GB 디스크

---

### 4. ☁️ **Render**
**백엔드 서비스 배포**

```bash
# 1. GitHub에 코드 푸시
git push origin main

# 2. Render 웹사이트에서 연결
# https://render.com
```

**장점:**
- ✅ 무료 티어 제공
- ✅ 자동 배포
- ✅ 데이터베이스 서비스
- ✅ SSL 인증서

**무료 제한:**
- 750시간/월 실행
- 슬립 모드 (비활성 시)

---

### 5. 🔥 **Firebase Hosting**
**Google의 무료 호스팅**

```bash
# 1. Firebase CLI 설치
npm i -g firebase-tools

# 2. 초기화 및 배포
firebase init hosting
firebase deploy
```

**장점:**
- ✅ 완전 무료
- ✅ 글로벌 CDN
- ✅ 자동 HTTPS
- ✅ Google 인증 연동

---

## 🎯 **추천 배포 전략**

### Option A: Vercel + PlanetScale (완전 무료)
```bash
# 프론트엔드: Vercel
# 백엔드: Vercel Serverless Functions
# 데이터베이스: PlanetScale (MySQL 무료)
```

### Option B: Railway (원스톱 솔루션)
```bash
# 모든 것을 Railway에서 처리
# 프론트엔드 + 백엔드 + 데이터베이스
```

### Option C: Netlify + Supabase
```bash
# 프론트엔드: Netlify
# 백엔드: Supabase (PostgreSQL + API)
```

---

## 🚀 **Railway 배포 가이드 (추천)**

### 1. Railway 계정 생성
- https://railway.app 접속
- GitHub 계정으로 로그인

### 2. 프로젝트 연결
```bash
# GitHub에서 프로젝트 선택
# 자동으로 빌드 및 배포 시작
```

### 3. 환경변수 설정
```bash
JWT_SECRET=your-production-secret-key
NODE_ENV=production
PORT=3000
```

### 4. 데이터베이스 추가
```bash
# Railway 대시보드에서 PostgreSQL 추가
# 자동으로 DATABASE_URL 생성
```

### 5. 도메인 설정
```bash
# 커스텀 도메인 연결 (선택사항)
# 기본 제공 도메인: https://your-app.railway.app
```

---

## 🛠️ **배포 전 준비사항**

### 1. 코드 최적화
```javascript
// server.js 수정 - 프로덕션 환경 대응
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 프로덕션에서만 압축 활성화
if (NODE_ENV === 'production') {
    app.use(compression());
}
```

### 2. 환경변수 설정
```bash
# .env.production 파일 생성
JWT_SECRET=your-super-secure-production-key
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
```

### 3. 정적 파일 최적화
```bash
# 이미지 압축
# CSS/JS 번들링
# 불필요한 파일 제거
```

---

## 📊 **무료 서비스 비교**

| 서비스 | 무료 제한 | 데이터베이스 | SSL | 커스텀 도메인 |
|--------|----------|-------------|-----|--------------|
| **Vercel** | 100GB/월 | ❌ | ✅ | ✅ |
| **Netlify** | 100GB/월 | ❌ | ✅ | ✅ |
| **Railway** | 500시간/월 | ✅ | ✅ | ✅ |
| **Render** | 750시간/월 | ✅ | ✅ | ✅ |
| **Firebase** | 무제한 | ❌ | ✅ | ✅ |

---

## 🎉 **즉시 배포하기**

### Railway로 5분 배포:
1. **GitHub에 코드 푸시** (이미 완료됨)
2. **Railway.app 접속**
3. **"New Project" → "Deploy from GitHub repo"**
4. **voucher-platform 선택**
5. **자동 배포 완료!**

### 배포 후 확인:
```bash
# 배포된 URL로 접속
https://your-app-name.railway.app

# API 테스트
curl https://your-app-name.railway.app/api/programs
```

---

## 💡 **추가 팁**

### 1. 성능 최적화
```javascript
// 이미지 최적화
// Next.js Image 컴포넌트 사용
// CDN 활용
```

### 2. 모니터링
```bash
# 무료 모니터링 도구
# - UptimeRobot (웹사이트 모니터링)
# - Sentry (에러 추적)
# - Google Analytics (사용자 분석)
```

### 3. 백업
```bash
# 정기적 데이터베이스 백업
# GitHub에 코드 백업 (이미 완료)
```

---

**무료로도 충분히 전문적인 서비스를 운영할 수 있습니다!** 🎉

어떤 배포 방식을 선택하시겠습니까?
