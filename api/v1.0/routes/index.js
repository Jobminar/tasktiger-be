import express from "express";
import coreRoutes from "./core.routes.js";
import adminRoutes from "../../v1.0/routes/admin.routes.js";
import serviceProviderRoutes from "./service-provider.routes.js";
import userRoutes from "./user.routes.js";

const app = express();

app.use("/core", coreRoutes);

app.use("/admin", adminRoutes);

app.use("/providers", serviceProviderRoutes); 

app.use("/users", userRoutes);   

export default app;
