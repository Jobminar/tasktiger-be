import Router from 'express'

import tierController from '../tier-controller/tier.controller.js'

const router=Router()

router.post("/",tierController.createTier)

router.get("/",tierController.getAllTier)

router.delete("/:id",tierController.deleteTier)

export default router