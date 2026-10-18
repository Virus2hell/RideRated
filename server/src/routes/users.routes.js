import { Router } from 'express';
import {
  getProfile, updateMe, updateAvatar, removeAvatar, updateBanner, removeBanner,
  searchUsers, follow, unfollow, listFollows,
} from '../controllers/users.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { uploadAvatar, uploadBanner } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAuth, searchUsers);

// "/me" routes first, so "me" is never treated as a username
router.patch('/me', requireAuth, updateMe);
router.post('/me/avatar', requireAuth, uploadAvatar, updateAvatar);
router.delete('/me/avatar', requireAuth, removeAvatar);
router.post('/me/banner', requireAuth, uploadBanner, updateBanner);
router.delete('/me/banner', requireAuth, removeBanner);

router.get('/:username', optionalAuth, getProfile);
router.get('/:username/followers', optionalAuth, listFollows('followers'));
router.get('/:username/following', optionalAuth, listFollows('following'));
router.post('/:username/follow', requireAuth, follow);
router.delete('/:username/follow', requireAuth, unfollow);

export default router;
