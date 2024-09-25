import { Schema, model } from "mongoose";

const chandraSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: true }
});

const Chandra = model("Chandra", chandraSchema);
export default Chandra;
