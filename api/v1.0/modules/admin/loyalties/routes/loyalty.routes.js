import express from 'express';
import loyaltiController from '../controller/loyalty.controller.js'

const router = express.Router();

router.post('/', loyaltiController.createLoyalti);
router.get('/', loyaltiController.getAllLoyalty);
router.delete('/:id',loyaltiController.deleteLoyalty)
router.patch('/:id',loyaltiController.updateLoyalty)
export default router;
