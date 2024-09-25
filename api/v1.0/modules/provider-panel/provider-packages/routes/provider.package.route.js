import express from 'express'
import packageController from '../controllers/provider.package.controller.js'

const router=express.Router()

router.post("/",packageController.createPackage)

router.get("/",packageController.getAllPackages)

router.delete("/:id",packageController.deletePackage)

router.get("/:providerId",packageController.getPackageByProviderId)

router.patch("/:id",packageController.updatePackage)

export default router