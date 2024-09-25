import express from 'express'
import bronzeController from '../controller/bronze.controller.js'

const router=express.Router()

router.post("/",bronzeController.createBronze)
router.get("/",bronzeController.getAllBronze)
router.delete("/bronze/:id",bronzeController.deleteBronze)
router.get("/get/:id",bronzeController.getBronzeById)

export default router