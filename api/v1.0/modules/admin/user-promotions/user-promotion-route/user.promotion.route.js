import express from 'express'
import userPromotionController from '../user-promotion-controller/user.promotion.controller.js'

const router=express.Router()

router.post("/",userPromotionController.createPromotion)

router.get("/",userPromotionController.getUserPromotions)

router.delete("/:id",userPromotionController.deletePromotion)

export default router   