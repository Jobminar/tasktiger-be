import express from 'express'
import reelsController from '../reels-controller/reels.controller.js'

const router=express.Router()

router.post("/video",reelsController.createReel)
router.get("/video",reelsController.getAllReels)
router.delete("/video/:id",reelsController.deleteReel)

export default router