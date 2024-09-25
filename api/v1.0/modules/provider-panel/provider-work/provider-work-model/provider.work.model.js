import mongoose from "mongoose";

const { Schema } = mongoose;

const workSchema = new Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  works: [{
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: [{ type: Schema.Types.ObjectId, ref: 'Subcategory' }],
    nameOfService: { type: String, required: true },
    experience: { type: String, required: true }
  }]

});

const Work = mongoose.model("Work", workSchema);
export default Work;
