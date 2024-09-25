 import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true, 
  },
  customerName: {
    type: String,
    required: true,
    trim: true, 
  },
  question: {
    type: String,
    required: true,
    trim: true, 
  },
  answer: {
    type: String,
    required: true,
    trim: true, 
  },
}, {
  timestamps: true,
});

const Faq = mongoose.model("Faq", faqSchema);

export default Faq;
