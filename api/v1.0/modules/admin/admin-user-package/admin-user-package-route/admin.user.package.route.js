import express from 'express'
import adminUserPackageController from '../admin-user-package-controller/admin.user.package.controller.js'

const router=express.Router()

router.post("/",adminUserPackageController.createAdminUserPackage)
router.get("/",adminUserPackageController.getAllAdminUserPackage)
router.delete("/:id",adminUserPackageController.deleteAdminUserPackage)
router.patch("/:id",adminUserPackageController.updateAdminUserPackage)
router.get("/:id",adminUserPackageController.getAdminUserPackage)

export default router