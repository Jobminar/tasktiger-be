import express from "express";
import catagoriesRoute from "../modules/_core/service-categories/routes/categories.route.js";
import servicesRoute from "../modules/_core/service-categories/routes/services.route.js";
import subCategoriesRoute from "../modules/_core/service-categories/routes/sub-categories.route.js";
import mapRouter from '../modules/_core/maps/map-route/map.route.js'
import inclusionExclusionRouter from '../modules/_core/Inclusion-Exclusion/inclusion-exclusion-route/inclusion.exclusion.route.js'
import locationsRouter from '../modules/_core/service-categories/routes/locations.route.js'
import notificationRouter from '../modules/_core/notifications/notification.route.js'
import razorRouter from '../../../razorpay.js';

const app = express();

app.use("/categories", catagoriesRoute);

app.use("/sub-categories", subCategoriesRoute);

app.use("/services", servicesRoute);

app.use("/map",mapRouter)

app.use("/inclusion-exclusion",inclusionExclusionRouter)

app.use("/locations",locationsRouter)

app.use("/notification",notificationRouter)

app.use("/razor",razorRouter)

export default app;
