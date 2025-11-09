// src/routes/api.ts
import { Router } from 'express';
import { BookController } from '../controllers/bookController.js';
import { upload } from '../middleware/upload.js';
const router = Router();
router.get('/books', BookController.apiList);
router.post('/books', upload.single('coverImage'), BookController.apiCreate);
router.get('/books/:id', BookController.apiGet);
router.put('/books/:id', upload.single('coverImage'), BookController.apiUpdate);
router.delete('/books/:id', BookController.apiDelete);
router.post('/books/:id/borrow', BookController.apiBorrow);
router.post('/books/:id/return', BookController.apiReturn);
export default router;
