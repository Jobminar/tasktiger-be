import express from 'express'
import subadminController from '../controller/sub-admin-controller.js'

const router=express.Router()

router.post("/signup",subadminController.subAdminRegister)
router.post("/login",subadminController.subAdminLogin)
router.get("/",subadminController.getAllSubAdmins)
router.patch("/",subadminController.updateSubadmin)

export default router