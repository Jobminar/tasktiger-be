import express from 'express'
import packageFaqController from '../package-faq-controller/package.faq.controller.js'

const router=express.Router()

router.post("/",packageFaqController.createFaqPackage)

router.get("/",packageFaqController.getAllFaqPackage)

router.delete("/:id",packageFaqController.deleteFaqPackage)

router.patch("/:id",packageFaqController.updateFaqPackage)

export default router