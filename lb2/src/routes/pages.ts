
import { Router } from 'express';
import { BookController } from '../controllers/bookController.js';

const router = Router();

router.get('/', BookController.listPage);
router.get('/books/create', BookController.createForm);
router.get('/books/:id', BookController.getPage);
router.get('/books/:id/edit', BookController.editForm);

export default router;
