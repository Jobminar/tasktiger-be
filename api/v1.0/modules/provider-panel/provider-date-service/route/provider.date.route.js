import express from 'express'
import providerDateController from '../controller/provider.date.controller.js'

const router=express.Router()

router.post("/",providerDateController.createDateController)
router.get("/",providerDateController.getAllDatesController)
router.get("/:id",providerDateController.getDateByproviderId)
router.post("/delete",providerDateController.deleteDateController)

export default router