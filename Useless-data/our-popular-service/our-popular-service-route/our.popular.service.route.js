import Router from 'express'
import popularServiceController from '../our-popular-service-controller/our.popular.service.controller.js'

const router=Router()

router.post("/",popularServiceController.createPopularService)

router.get("/",popularServiceController.getAllPopularServices)

router.get("/:id",popularServiceController.getPopularServiceById)

router.delete("/:id",popularServiceController.deletePopularService)

router.patch("/:id",popularServiceController.updatePopularService)

export default router