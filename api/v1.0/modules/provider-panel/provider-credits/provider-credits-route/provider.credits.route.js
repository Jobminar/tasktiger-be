import express from 'express'

import providerCreditsController from '../provider-credits-controller/provider.credits.controller.js'
const router=express.Router()

router.post("/recharge",providerCreditsController.addCredits)
router.post('/penalty', providerCreditsController.applyPenalty);
router.post("/expense",providerCreditsController.addExpense)
router.get("/:providerId",providerCreditsController.getProviderCredits)
router.delete("/:providerId",providerCreditsController.deleteProviderCredits)


export default router