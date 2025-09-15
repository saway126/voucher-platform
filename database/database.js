const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'voucher_platform.db');
        this.init();
    }

    init() {
        // 데이터베이스 디렉토리 생성
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('데이터베이스 연결 오류:', err.message);
            } else {
                console.log('✅ SQLite 데이터베이스에 연결되었습니다.');
                this.createTables();
            }
        });
    }

    createTables() {
        this.db.serialize(() => {
            // 테이블 생성
            const tables = [
                // 사용자 테이블
                `CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    phone TEXT,
                    type TEXT NOT NULL DEFAULT 'individual',
                    birth_date TEXT,
                    gender TEXT,
                    address TEXT,
                    role TEXT NOT NULL DEFAULT 'applicant',
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,

                // 사업 테이블
                `CREATE TABLE IF NOT EXISTS programs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    type TEXT NOT NULL DEFAULT 'announcement',
                    budget INTEGER NOT NULL DEFAULT 0,
                    max_applicants INTEGER,
                    application_start DATETIME,
                    application_end DATETIME,
                    review_start DATETIME,
                    review_end DATETIME,
                    announcement_date DATETIME,
                    eligibility_criteria TEXT,
                    status TEXT NOT NULL DEFAULT 'draft',
                    created_by INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )`,

                // 신청서 테이블
                `CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    application_number TEXT UNIQUE NOT NULL,
                    applicant_id INTEGER NOT NULL,
                    program_id INTEGER NOT NULL,
                    form_data TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'submitted',
                    score REAL DEFAULT 0,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (applicant_id) REFERENCES users (id),
                    FOREIGN KEY (program_id) REFERENCES programs (id)
                )`,

                // 심사 테이블
                `CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    application_id INTEGER NOT NULL,
                    reviewer_id INTEGER NOT NULL,
                    round INTEGER NOT NULL DEFAULT 1,
                    score REAL NOT NULL,
                    comment TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES applications (id),
                    FOREIGN KEY (reviewer_id) REFERENCES users (id)
                )`,

                // 배분 테이블
                `CREATE TABLE IF NOT EXISTS allocations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    program_id INTEGER NOT NULL,
                    allocation_rules TEXT NOT NULL,
                    allocation_result TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'draft',
                    confirmed_by INTEGER,
                    confirmed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (program_id) REFERENCES programs (id),
                    FOREIGN KEY (confirmed_by) REFERENCES users (id)
                )`,

                // 바우처 테이블
                `CREATE TABLE IF NOT EXISTS vouchers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    program_id INTEGER NOT NULL,
                    applicant_id INTEGER NOT NULL,
                    amount INTEGER NOT NULL,
                    balance INTEGER NOT NULL,
                    expiry_date DATETIME,
                    usage_limit INTEGER DEFAULT 1,
                    status TEXT NOT NULL DEFAULT 'active',
                    issued_by INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (program_id) REFERENCES programs (id),
                    FOREIGN KEY (applicant_id) REFERENCES users (id),
                    FOREIGN KEY (issued_by) REFERENCES users (id)
                )`,

                // 바우처 사용 내역 테이블
                `CREATE TABLE IF NOT EXISTS voucher_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    voucher_id INTEGER NOT NULL,
                    amount INTEGER NOT NULL,
                    merchant_name TEXT,
                    usage_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (voucher_id) REFERENCES vouchers (id)
                )`,

                // 알림 테이블
                `CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    recipient_id INTEGER NOT NULL,
                    channel TEXT NOT NULL,
                    template TEXT NOT NULL,
                    content TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    sent_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (recipient_id) REFERENCES users (id)
                )`,

                // 파일 테이블
                `CREATE TABLE IF NOT EXISTS files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    original_name TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    mime_type TEXT NOT NULL,
                    owner_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES users (id)
                )`,

                // 감사 로그 테이블
                `CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    actor_id INTEGER NOT NULL,
                    action TEXT NOT NULL,
                    target_type TEXT NOT NULL,
                    target_id INTEGER,
                    details TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (actor_id) REFERENCES users (id)
                )`
            ];

            // 테이블 생성
            tables.forEach((sql, index) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error(`테이블 생성 오류 (${index + 1}):`, err.message);
                    } else {
                        console.log(`✅ 테이블 ${index + 1} 생성 완료`);
                    }
                });
            });

            // 인덱스는 필요할 때 생성 (초기화 시에는 제외)
            console.log('🎉 데이터베이스 초기화 완료!');
        });
    }

    createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status)',
            'CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id)',
            'CREATE INDEX IF NOT EXISTS idx_applications_program ON applications(program_id)',
            'CREATE INDEX IF NOT EXISTS idx_reviews_application ON reviews(application_id)',
            'CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id)',
            'CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id)'
        ];

        indexes.forEach((sql, index) => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error(`인덱스 생성 오류 (${index + 1}):`, err.message);
                } else {
                    console.log(`✅ 인덱스 ${index + 1} 생성 완료`);
                }
            });
        });
    }

    // 데이터베이스 연결 종료
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('데이터베이스 연결 종료 오류:', err.message);
                } else {
                    console.log('✅ 데이터베이스 연결이 종료되었습니다.');
                }
            });
        }
    }

    // 쿼리 실행 (Promise 기반)
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // 단일 행 조회 (Promise 기반)
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 여러 행 조회 (Promise 기반)
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 트랜잭션 실행
    transaction(callback) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                callback(this)
                    .then(() => {
                        this.db.run('COMMIT', (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    })
                    .catch((err) => {
                        this.db.run('ROLLBACK', (rollbackErr) => {
                            reject(err);
                        });
                    });
            });
        });
    }
}

// 싱글톤 인스턴스
const database = new Database();

module.exports = database;
