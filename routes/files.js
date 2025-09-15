const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('지원하지 않는 파일 형식입니다.'));
        }
    }
});

// 파일 업로드
router.post('/upload', [authMiddleware, upload.single('file')], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '파일이 선택되지 않았습니다.'
            });
        }

        const { originalname, filename, path: filePath, size, mimetype } = req.file;
        const ownerId = req.user.userId;

        // 파일 정보 저장
        const result = await database.run(`
            INSERT INTO files (filename, original_name, file_path, file_size, mime_type, owner_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [filename, originalname, filePath, size, mimetype, ownerId]);

        // 감사 로그
        await database.run(
            'INSERT INTO audit_logs (actor_id, action, target_type, target_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [ownerId, 'upload_file', 'file', result.id, req.ip, req.get('User-Agent')]
        );

        res.status(201).json({
            success: true,
            message: '파일이 업로드되었습니다.',
            data: {
                fileId: result.id,
                filename: filename,
                originalName: originalname,
                size: size,
                mimeType: mimetype
            }
        });

    } catch (error) {
        console.error('파일 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 파일 다운로드
router.get('/:id/download', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // 파일 정보 조회
        const file = await database.get(
            'SELECT * FROM files WHERE id = ? AND owner_id = ?',
            [id, userId]
        );

        if (!file) {
            return res.status(404).json({
                success: false,
                message: '파일을 찾을 수 없습니다.'
            });
        }

        // 파일 존재 확인
        if (!fs.existsSync(file.file_path)) {
            return res.status(404).json({
                success: false,
                message: '파일이 서버에 존재하지 않습니다.'
            });
        }

        // 파일 다운로드
        res.download(file.file_path, file.original_name);

    } catch (error) {
        console.error('파일 다운로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 내 파일 목록 조회
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const ownerId = req.user.userId;

        const files = await database.all(`
            SELECT * FROM files 
            WHERE owner_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [ownerId, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            data: {
                files: files.map(file => ({
                    id: file.id,
                    filename: file.filename,
                    originalName: file.original_name,
                    size: file.file_size,
                    mimeType: file.mime_type,
                    createdAt: file.created_at
                }))
            }
        });

    } catch (error) {
        console.error('파일 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
