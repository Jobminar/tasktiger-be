import express from "express";
import authRouter from "../modules/admin/auth/routes/admin.route.js";
import goldRouter from "../modules/admin/loyalties/routes/gold.route.js"
import silverRouter from "../modules/admin/loyalties/routes/silver.route.js"
import bronzeRouter from "../modules/admin/loyalties/routes/bronze.route.js"
import userPromotionRoutes from '../modules/admin/user-promotions/user-promotion-route/user.promotion.route.js'
import providerPromotionRoutes from "../modules/admin/promotions/routes/provider-promotion.route.js"
import inductionRoutes from "../modules/admin/induction/routes/induction.route.js"
import trainingRoutes from "../modules/admin/training/routes/training.route.js"
import subAdminRoutes from "../modules/admin/sub-admin/routes/sub-admin-route.js"
import loyaltyRouter from '../modules/admin/loyalties/routes/loyalty.routes.js'
import marketRouter from '../modules/admin/marketing/routes/market.routes.js'
import adminUserPackageRouter from '../modules/admin/admin-user-package/admin-user-package-route/admin.user.package.route.js'
import jobsRouter from '../modules/admin/jobs-area/router/jobs.router.js'
import reelsRouter from '../modules/admin/reels/reels-route/reels.route.js'
import blogsRouter from '../modules/admin/blogs/blogs-route/blogs.route.js'
import bannersRouter from '../modules/admin/banners/banners-route/banners.route.js'
import adminProviderPackageRouter from '../modules/admin/admin-provider-packages/admin-provider-routes/admin.provider.routes.js'

const app = express();

app.use("/admin-auth", authRouter);
app.use("/gold",goldRouter)
app.use("/silver",silverRouter)
app.use("/bronze",bronzeRouter)
app.use("/blogs",blogsRouter)
app.use("/user-promotions", userPromotionRoutes);
app.use("/provider-promotions", providerPromotionRoutes);
app.use("/induction", inductionRoutes);
app.use("/training", trainingRoutes);
app.use("/sub-admin",subAdminRoutes)
app.use("/loyalty",loyaltyRouter)
app.use("/market",marketRouter)
app.use("/admin-provider-package",adminProviderPackageRouter)
app.use("/admin-user-package",adminUserPackageRouter)
app.use("/jobs-area",jobsRouter)
app.use("/reels",reelsRouter)
app.use("/banners",bannersRouter)



export default app;
