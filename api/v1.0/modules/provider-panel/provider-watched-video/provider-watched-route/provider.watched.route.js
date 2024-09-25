import express from 'express';
import providerWatchedController from '../provider-watched-controller/provider.watched.controller.js'

const router = express.Router();


router.post('/', providerWatchedController.createOrUpdateWatchStatus);

router.get('/:providerId',providerWatchedController.getWatchedProviderById)

export default router;
