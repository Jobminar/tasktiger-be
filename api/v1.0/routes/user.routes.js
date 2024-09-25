import express from "express";
import userAuthRouter from '../modules/users-panel/user-auth/user-auth-routes/user.auth.route.js'
import paymentRouter from "../modules/users-panel/user-cart/routes/user.payment.routes.js";
import orderRouter from "../modules/users-panel/user-cart/routes/user.order.routes.js";
import walletRouter from "../modules/users-panel/wallet/route/wallet.route.js";
import cartRouter from "../modules/users-panel/user-cart/routes/user.cart.routes.js";
import userAddressRouter from "../modules/users-panel/user-address/user-address-routes/user.address.route.js"
import userTokenRouter from '../modules/users-panel/user-token/user-token-route/user.token.route.js'
import orderHistoryRouter from '../modules/users-panel/order-history/order-history-route/order.history.route.js'
import faqRouter from '../modules/users-panel/FAQ/faq-route/faq.route.js'
import faqPackageRouter from "../modules/users-panel/package-faq/package-faq-route/package.faq.route.js"
import userPackageRouter from '../modules/users-panel/user-packages/user-packages-route/user.packages.route.js'

const app = express();

app.use("/userAuth", userAuthRouter);
app.use("/payment", paymentRouter);
app.use("/order", orderRouter);
app.use("/cart", cartRouter);
app.use("/wallet", walletRouter);  
app.use("/user-address",userAddressRouter)
app.use("/user-token",userTokenRouter)
app.use("/order-history",orderHistoryRouter)
app.use("/faq",faqRouter)
app.use("/faq-package",faqPackageRouter)
app.use("/user-packages",userPackageRouter)


export default app; 
