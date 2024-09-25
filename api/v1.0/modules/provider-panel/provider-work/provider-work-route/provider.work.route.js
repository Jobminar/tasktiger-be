import express from 'express'
import workController from '../provider-work-controller/provider.work.controller.js'

const router=express.Router()

router.post("/",workController.createWork)
router.get("/",workController.getAllWork)
router.get("/:providerId",workController.getWorkByProviderId)
router.delete("/:id",workController.deleteWork)
router.put("/:id",workController.updateWork)

export default router