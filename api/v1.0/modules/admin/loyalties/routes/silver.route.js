import express from 'express'
import silverController from '../controller/silver.controller.js'

const router=express.Router()

router.post("/",silverController.createSilver)
router.get("/",silverController.getAllSilver)
router.delete("/delete/:id",silverController.deleteSilver)
router.get("/silver/:id",silverController.getSilverById)

export default router