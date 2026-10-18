import { Router } from 'express';
import { listRoads, getRoad } from '../controllers/roads.controller.js';

const router = Router();

router.get('/', listRoads);
router.get('/:id', getRoad);

export default router;
