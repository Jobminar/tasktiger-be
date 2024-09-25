import Router from 'express'
import faqController from '../faq-controller/faq.controller.js'

const router=Router()

router.post("/",faqController.createFaq)
router.get("/",faqController.getAllFaqs)
router.get("/:id",faqController.getFaqById)
router.delete("/:id",faqController.deleteFaqById)
router.put("/:id",faqController.updateFaqById)

export default router