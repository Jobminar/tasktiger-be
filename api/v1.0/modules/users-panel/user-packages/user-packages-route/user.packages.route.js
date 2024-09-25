import express from 'express'
import userPackageController from '../user-packages-controller/user.packages.controller.js'

const router=express.Router()

router.post("/",userPackageController.createUserPackage)

router.get("/",userPackageController.getAllUserPackages)

router.get("/:userId",userPackageController.getUserPackageByUserId)

router.delete("/:id",userPackageController.deleteUserPackage)

export default router