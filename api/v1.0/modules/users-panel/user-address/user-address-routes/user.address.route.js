import express from 'express'
import userAddressController from '../user-address-controllers/user.address.controller.js'

const router=express.Router()

router.post("/",userAddressController.createAddress)

router.get("/",userAddressController.getAllAddress)

router.get("/:userId",userAddressController.getUserById)

router.delete("/:id",userAddressController.deleteAddress)

router.delete("/:userId",userAddressController.deleteAddressByUserId)

router.patch("/:id",userAddressController.updateAddress)

export default router