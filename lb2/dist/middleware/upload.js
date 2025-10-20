import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/covers');
async function ensureUploadDir() {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }
    catch (err) { /* ignore */ }
}
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        await ensureUploadDir();
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, safeName);
    }
});
export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
//# sourceMappingURL=upload.js.map