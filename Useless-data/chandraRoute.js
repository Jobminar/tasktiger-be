import express from 'express'
import chandraController from './chandraController.js'

const router=express.Router()

router.post("/",chandraController.createChandra)
router.get("/",chandraController.getAllChandra)

export default router