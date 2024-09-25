import express from 'express';

import providerBannerController from '../controller/provider.banner.controller.js';

const router = express.Router();

router.post('/', providerBannerController.createBanner);
router.get('/', providerBannerController.getAllBanners);
router.get('/banners/:id', providerBannerController.getBannerById);
router.delete('/banners/:id', providerBannerController.deleteBanner);
router.patch('/:id',providerBannerController.updateBanner)

export default router;
 

