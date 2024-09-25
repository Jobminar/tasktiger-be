import { Schema, model } from 'mongoose';

const jobsSchema = new Schema({
    adminId: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    subService: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true } 
});

const Jobs = model("Jobs", jobsSchema);

export default Jobs;
