import { Schema, model } from "mongoose";

const marketSchema = new Schema({
    type: {
        type: String,
        enum: ['user', 'non-user', 'provider'],
        required: true
    },
    location: {
        type: String,
        required: true
    },
    ageGroup: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },
    message: {
        type: String,
        enum: ['whatsapp', 'inapp', 'sms', 'email'],
        required: true
    }
});

const Market = model("Market", marketSchema);
export default Market;
