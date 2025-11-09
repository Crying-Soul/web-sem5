// src/middleware/upload.ts
import multer from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/covers');
  },
  filename: (req, file, cb) => {
    const ext = extname(file.originalname) || '.jpg';
    cb(null, `${Date.now().toString(36)}-${uuidv4()}${ext.toLowerCase()}`);
  },
});

export const upload = multer({
  storage,
  limits: { 
    fileSize: 3 * 1024 * 1024, // 3MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Разрешены только файлы изображений (JPEG, PNG, WebP)'));
    }
    
    cb(null, true);
  },
});