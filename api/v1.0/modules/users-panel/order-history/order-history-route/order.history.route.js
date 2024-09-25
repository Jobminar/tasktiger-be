
import express from "express";

import ordersHistoryController from '../orders-history-controller/orders.history.controller.js'

const router = express.Router();

router.post("/accept-order", ordersHistoryController.acceptOrder);

router.post("/verify-start-order", ordersHistoryController.verifyStartOrder); 

router.post("/order-completed-generateotp", ordersHistoryController.orderCompletedGenerate);

router.post("/before-work-upload-image",ordersHistoryController.beforeWorkUploadImage)

router.post("/after-work-upload-image",ordersHistoryController.afterWorkUploadImage)

router.post("/order-completed-verify", ordersHistoryController.completeOrderVerify);

router.post("/pay-order", ordersHistoryController.payOrder);

router.post("/cancel-order", ordersHistoryController.cancelOrder);


router.get("/:providerId",ordersHistoryController.getOrdersHistoryByProviderId)

router.get('/user/:userId', ordersHistoryController.getOrderHistoryByUserId);

router.get("/",ordersHistoryController.getAllHistory)

export default router;
