import express from 'express';
import marketController from '../controller/market.controller.js'

const router = express.Router();

router.post('/', marketController.createMarket);
router.get('/', marketController.getAllMarkets);
router.get('/:id',marketController.getMarketById)

export default router;
