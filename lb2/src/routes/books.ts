import { Router } from 'express';
import { BookController } from '../controllers/bookController.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Book routes
router.get('/', BookController.getAllBooks);
router.get('/create', BookController.createBookForm);
router.post('/', upload.single('coverImageFile'), BookController.createBook);
router.get('/search', BookController.searchBooks);

// Book detail routes
router.get('/:id', BookController.getBookById);
router.get('/:id/edit', BookController.updateBookForm);
router.post('/:id', upload.single('coverImageFile'), BookController.updateBook);
router.delete('/:id', BookController.deleteBook);

// Book actions
router.post('/:id/borrow', BookController.borrowBook);
router.post('/:id/return', BookController.returnBook);

export default router;