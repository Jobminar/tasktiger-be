import express from 'express'
import ourCoreServicesController from '../controller/our.core.servicescontroller.js'

const router=express.Router()

router.post("/",ourCoreServicesController.createOurCoreService)
router.get("/",ourCoreServicesController.getAllOurCoreServices)
router.delete("/:id",ourCoreServicesController.deleteOurCoreService)
router.patch("/:id",ourCoreServicesController.updateOurCoreService)
router.get("/:id",ourCoreServicesController.getOurCoreServiceById)

export default router