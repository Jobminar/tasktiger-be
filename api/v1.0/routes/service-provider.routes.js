import express from "express";
import serviceProviderRoutes from "../modules/provider-panel/provider-service/route/provider.route.js";
import serviceTargetRoutes from "../modules/provider-panel/provider-target/route/provider-target.route.js";
import serviceFinanaceRoutes from "../modules/provider-panel/provider-finance/routes/provider-finance.route.js";
import providerAuthRouter from "../modules/provider-panel/provider-auth/routes/provider.auth.route.js"
import providerDetailsRouter from "../modules/provider-panel/provider-deatils/route/provider.details.route.js";
import providerCertificateRouter from "../modules/provider-panel/provider-certificate/route/provider.certificate.route.js";
import providerEarningsRouter from "../modules/provider-panel/provider-earnings/route/provider.earning.route.js";
import providerDateRouter from "../modules/provider-panel/provider-date-service/route/provider.date.route.js";
import providerFinanceRouter from "../modules/provider-panel/provider-finance/routes/provider-finance.route.js";
import workRouter from "../modules/provider-panel/provider-work/provider-work-route/provider.work.route.js"
import providerCreditsRouter from '../modules/provider-panel/provider-credits/provider-credits-route/provider.credits.route.js'
import cordinatesRouter from '../modules/provider-panel/provider-cordinates/cordinates-route/cordinates.route.js'
import providerTokenRouter from '../modules/provider-panel/provider-token/provider-token-route/provider.token.route.js'
import watchedVideoRouter from '../modules/provider-panel/provider-watched-video/provider-watched-route/provider.watched.route.js'
import providerPackageRouter from '../modules/provider-panel/provider-packages/routes/provider.package.route.js'

const app = express();

app.use("/service-providers", serviceProviderRoutes);
app.use("/service-provider-targets", serviceTargetRoutes);
app.use("/service-provider-finances", serviceFinanaceRoutes);
app.use("/provider-auth", providerAuthRouter);
app.use("/provider-details", providerDetailsRouter);
app.use("/provider-certificate", providerCertificateRouter);
app.use("/earnings", providerEarningsRouter);
app.use("/provider-date", providerDateRouter);
app.use("/provider-finance", providerFinanceRouter);  
app.use("/work",workRouter)
app.use("/provider-credits",providerCreditsRouter)
app.use("/cordinates",cordinatesRouter)
app.use("/provider-token",providerTokenRouter)
app.use("/provider-watched-video",watchedVideoRouter)
app.use("/provider-package",providerPackageRouter)

export default app;
  