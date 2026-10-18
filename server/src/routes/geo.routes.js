import { Router } from 'express';
import { searchRoads, lookupPincode } from '../controllers/geo.controller.js';

const router = Router();

router.get('/roads', searchRoads);
router.get('/pincode/:pin', lookupPincode);

export default router;
