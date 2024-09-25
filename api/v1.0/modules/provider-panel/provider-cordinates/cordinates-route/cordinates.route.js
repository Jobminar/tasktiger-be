import express from 'express'
import cordinatesController from '../cordinates-controller/cordinates.controller.js'

const router=express.Router()

router.post("/",cordinatesController.createCordinates)
router.get("/",cordinatesController.getAllCordinates)
router.delete("/:id",cordinatesController.deleteCordinates)
router.get("/:providerId",cordinatesController.getProviderById)

export default router