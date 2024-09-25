import express from 'express'
import providerTokenController from '../provider-token-controller/provider.token.controller.js'

const router=express.Router()

router.post("/",providerTokenController.createOrUpdateProviderToken)
router.get("/",providerTokenController.getAllProviderTokens)
router.delete("/delete",providerTokenController.deleteAllProviderTokens)

export default router