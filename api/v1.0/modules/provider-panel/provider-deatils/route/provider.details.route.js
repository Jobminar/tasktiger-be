import express from 'express'
import providerDetailsController from '../controller/provider.details.controller.js'

const router=express.Router()

router.post("/",providerDetailsController.createProvider)
router.get("/",providerDetailsController.getAllProviders)
router.delete("/:id",providerDetailsController.deleteProvider)
router.get("/:providerId",providerDetailsController.getDetailsByProviderId)
router.put("/:id",providerDetailsController.updateProvider)
router.patch("/:providerId",providerDetailsController.updateProviderId)

export default router      