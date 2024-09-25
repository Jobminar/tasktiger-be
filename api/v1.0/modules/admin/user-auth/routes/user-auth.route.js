import express from 'express'
import userController from '../controller/user-auth.controller.js'

const router=express.Router()

router.post("/login",userController.createUser)

export default router