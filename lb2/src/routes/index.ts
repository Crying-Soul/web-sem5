import { Router } from 'express';
import booksRouter from './books.js';

const router = Router();

// Home page
router.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home Library',
        currentPath: req.path
    });
});

// Books routes
router.use('/books', booksRouter);

export default router;