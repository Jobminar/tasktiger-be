    import mongoose from "mongoose";

    const providerAuthSchema = new mongoose.Schema({
        phone: { type: String, required: true, unique: true },
        otp: { type: String },
        otpCreatedAt: { type: Date },
        isVerified: { type: Boolean, default: false }
    });

    const ProviderAuth = mongoose.model("ProviderAuth", providerAuthSchema);

    export default ProviderAuth;