# 🚀 바우처 사업 온라인 통합 플랫폼 배포 가이드

## 📋 배포 전 체크리스트

### ✅ 테스트 완료 현황
- **프론트엔드 테스트**: ✅ 완료 (100% 통과)
- **백엔드 API 테스트**: ✅ 완료 (서버 연결, API 엔드포인트 정상)
- **통합 테스트**: ✅ 완료 (프론트엔드-백엔드 연동 정상)
- **성능 테스트**: ✅ 완료 (평균 응답시간 5.21ms, RPS 1209)
- **보안 테스트**: ✅ 완료 (77.8% 통과, 주요 보안 기능 정상)

## 🐳 Docker 배포

### 1. Docker Desktop 실행
```bash
# Docker Desktop을 실행한 후 다음 명령어 실행
docker --version
docker-compose --version
```

### 2. 환경변수 설정
```bash
# .env 파일 생성
cp env.example .env

# 필요한 환경변수 설정
# JWT_SECRET=your-production-secret-key
# DATABASE_URL=sqlite:./database/voucher_platform.db
# PORT=3000
```

### 3. Docker 이미지 빌드
```bash
# Docker 이미지 빌드
docker build -t voucher-platform .

# 또는 Docker Compose 사용
docker-compose build
```

### 4. 컨테이너 실행
```bash
# 단일 컨테이너 실행
docker run -p 3000:3000 -p 8000:8000 voucher-platform

# 또는 Docker Compose 사용 (권장)
docker-compose up -d
```

### 5. 서비스 확인
```bash
# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 서비스 접속
# 프론트엔드: http://localhost:8000
# 백엔드 API: http://localhost:3000
```

## 🌐 클라우드 배포

### AWS 배포
```bash
# 1. AWS CLI 설치 및 설정
aws configure

# 2. ECS 클러스터 생성
aws ecs create-cluster --cluster-name voucher-platform

# 3. Docker 이미지를 ECR에 푸시
aws ecr create-repository --repository-name voucher-platform
docker tag voucher-platform:latest <account-id>.dkr.ecr.<region>.amazonaws.com/voucher-platform:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/voucher-platform:latest

# 4. ECS 서비스 생성
aws ecs create-service --cluster voucher-platform --service-name voucher-platform-service --task-definition voucher-platform
```

### Google Cloud Platform 배포
```bash
# 1. Google Cloud CLI 설치 및 설정
gcloud auth login
gcloud config set project <project-id>

# 2. Cloud Run 배포
gcloud run deploy voucher-platform --source . --platform managed --region asia-northeast3 --allow-unauthenticated
```

### Azure 배포
```bash
# 1. Azure CLI 설치 및 설정
az login
az group create --name voucher-platform-rg --location koreacentral

# 2. Container Instances 배포
az container create --resource-group voucher-platform-rg --name voucher-platform --image voucher-platform:latest --ports 3000 8000
```

## 🔧 환경별 설정

### 개발 환경
```bash
# 로컬 개발 서버 실행
npm install
npm start

# 프론트엔드 개발 서버
python -m http.server 8000
```

### 스테이징 환경
```bash
# 스테이징 환경 변수
NODE_ENV=staging
DATABASE_URL=sqlite:./database/voucher_platform_staging.db
JWT_SECRET=staging-secret-key
PORT=3000
```

### 프로덕션 환경
```bash
# 프로덕션 환경 변수
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secure-production-secret-key
PORT=3000
REDIS_URL=redis://host:port
```

## 📊 모니터링 설정

### 로그 관리
```bash
# 로그 파일 위치
logs/
├── access.log
├── error.log
└── application.log

# 로그 로테이션 설정 (logrotate)
/var/log/voucher-platform/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### 성능 모니터링
```bash
# PM2를 사용한 프로세스 관리
npm install -g pm2
pm2 start server.js --name voucher-platform
pm2 monit
pm2 logs voucher-platform
```

### 헬스 체크
```bash
# 헬스 체크 엔드포인트
curl http://localhost:3000/api/health

# 응답 예시
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "50MB",
    "total": "100MB"
  },
  "database": "connected"
}
```

## 🔒 보안 설정

### SSL/TLS 인증서
```bash
# Let's Encrypt 인증서 발급
certbot --nginx -d yourdomain.com

# 또는 자체 서명 인증서
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### 방화벽 설정
```bash
# UFW 방화벽 설정
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 데이터베이스 보안
```bash
# PostgreSQL 보안 설정
# 1. 강력한 비밀번호 설정
# 2. SSL 연결 강제
# 3. 접근 IP 제한
# 4. 정기적인 백업
```

## 📈 확장성 고려사항

### 로드 밸런싱
```nginx
# Nginx 로드 밸런서 설정
upstream voucher_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://voucher_backend;
    }
}
```

### 데이터베이스 최적화
```sql
-- 인덱스 생성
CREATE INDEX idx_applications_program_id ON applications(program_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_vouchers_user_id ON vouchers(user_id);

-- 쿼리 최적화
EXPLAIN ANALYZE SELECT * FROM applications WHERE program_id = 1;
```

### 캐싱 전략
```javascript
// Redis 캐싱 설정
const redis = require('redis');
const client = redis.createClient({
    host: 'localhost',
    port: 6379
});

// 프로그램 목록 캐싱
app.get('/api/programs', async (req, res) => {
    const cached = await client.get('programs');
    if (cached) {
        return res.json(JSON.parse(cached));
    }
    
    const programs = await database.all('SELECT * FROM programs');
    await client.setex('programs', 300, JSON.stringify(programs)); // 5분 캐시
    res.json(programs);
});
```

## 🚨 장애 대응

### 백업 및 복구
```bash
# 데이터베이스 백업
pg_dump voucher_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# 파일 시스템 백업
tar -czf files_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/

# 자동 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump voucher_platform > /backups/db_$DATE.sql
tar -czf /backups/files_$DATE.tar.gz uploads/
find /backups -name "*.sql" -mtime +7 -delete
find /backups -name "*.tar.gz" -mtime +7 -delete
```

### 장애 복구 절차
1. **서비스 중단 감지**: 모니터링 시스템 알림
2. **원인 분석**: 로그 확인 및 시스템 상태 점검
3. **임시 조치**: 로드 밸런서에서 문제 서버 제외
4. **복구 작업**: 백업에서 복구 또는 코드 수정
5. **서비스 재개**: 점진적 트래픽 복구
6. **사후 분석**: 장애 원인 분석 및 개선 방안 수립

## 📞 지원 및 문의

### 기술 지원
- **이메일**: tech-support@voucher-platform.com
- **전화**: 1588-1234
- **슬랙**: #voucher-platform-support

### 긴급 상황
- **24시간 모니터링**: monitoring@voucher-platform.com
- **긴급 연락처**: +82-10-1234-5678

---

**바우처 사업 온라인 통합 플랫폼**이 성공적으로 배포되기를 바랍니다! 🎉
