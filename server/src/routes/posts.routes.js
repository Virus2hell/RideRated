import { Router } from 'express';
import { listPosts, getPost, createPost, deletePost, likePost, unlikePost } from '../controllers/posts.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { uploadPhotos } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAuth, listPosts);
router.post('/', requireAuth, uploadPhotos, createPost);
router.get('/:id', optionalAuth, getPost);
router.delete('/:id', requireAuth, deletePost);
router.post('/:id/like', requireAuth, likePost);
router.delete('/:id/like', requireAuth, unlikePost);

export default router;
