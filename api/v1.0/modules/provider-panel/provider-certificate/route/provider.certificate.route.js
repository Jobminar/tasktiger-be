import express from 'express'
import providerCertificate from '../controller/provider.certificate.controller.js'

const router=express.Router()

router.post("/",providerCertificate.uploadCertificate)  

router.get("/",providerCertificate.getAllCertificates)

router.get("/:providerId",providerCertificate.getCertificatesByproviderId)

router.delete("/:id",providerCertificate.deleteCertificate)

router.patch("/:id",providerCertificate.updateCertificate)

export default router