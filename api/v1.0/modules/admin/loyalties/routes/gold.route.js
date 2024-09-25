import express from 'express';
import goldController from '../controller/gold.controller.js';


const router = express.Router();

router.post('/', goldController.createGold);
router.get('/', goldController.getAllGold);
router.get('/gold/:id', goldController.getGoldById);
router.delete('/gold/:id', goldController.deleteGold);

export default router;
