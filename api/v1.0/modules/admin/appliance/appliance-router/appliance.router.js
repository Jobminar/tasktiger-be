import Router from 'express'
import applianceController from '../appliance-controller/appliance.controller.js'

const router=Router()

router.post("/",applianceController.createAppliance)

router.get("/",applianceController.getAllAppliances)

router.get("/:id",applianceController.getApplianceById)

router.patch("/:id",applianceController.updateAppliance)

router.delete("/:id",applianceController.deleteAppliance)

export default router
