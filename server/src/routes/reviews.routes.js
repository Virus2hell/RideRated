import { Router } from 'express';
import {
  listReviews, getReview, createReview, deleteReview,
  likeReview, unlikeReview, listComments, addComment, deleteComment,
} from '../controllers/reviews.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { uploadPhotos } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAuth, listReviews);
router.post('/', requireAuth, uploadPhotos, createReview);
router.get('/:id', optionalAuth, getReview);
router.delete('/:id', requireAuth, deleteReview);

router.post('/:id/like', requireAuth, likeReview);
router.delete('/:id/like', requireAuth, unlikeReview);

router.get('/:id/comments', listComments);
router.post('/:id/comments', requireAuth, addComment);
router.delete('/:id/comments/:commentId', requireAuth, deleteComment);

export default router;
