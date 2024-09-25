import express from 'express'
import userTokenController from '../user-token-controller/user.token.controller.js'

const router=express.Router()

router.post("/",userTokenController.createOrUpdateToken)

router.get("/",userTokenController.getAllTokens)

router.delete("/delete",userTokenController.deleteAllUserTokens)

export default router