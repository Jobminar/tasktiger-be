import Faq from '../faq-model/faq.model.js'


const faqController={

 createFaq : async (req, res) => {
  try {
    const { serviceId, customerName, question, answer } = req.body;

    // Validate input
    if (!serviceId || !customerName || !question || !answer) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newFaq = new Faq({
      serviceId,
      customerName,
      question,
      answer,
    });

    const savedFaq = await newFaq.save();
    res.status(201).json(savedFaq);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ', details: error.message });
  }
},

// Get all FAQs
 getAllFaqs : async (req, res) => {
  try {
    const faqs = await Faq.find().populate('serviceId');
    res.status(200).json(faqs);
  } catch (error) {
    console.error('Error retrieving FAQs:', error);
    res.status(500).json({ error: 'Failed to retrieve FAQs', details: error.message });
  }
},

// Get FAQ by ID
 getFaqById :async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id).populate('serviceId');
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.status(200).json(faq);
  } catch (error) {
    console.error('Error retrieving FAQ:', error);
    res.status(500).json({ error: 'Failed to retrieve FAQ', details: error.message });
  }
},

// Update FAQ by ID
 updateFaqById : async (req, res) => {
  try {
    const { serviceId, customerName, question, answer } = req.body;

    const updateData = {
      serviceId,
      customerName,
      question,
      answer,
    };

    const updatedFaq = await Faq.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedFaq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.status(200).json(updatedFaq);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ', details: error.message });
  }
},

// Delete FAQ by ID
 deleteFaqById : async (req, res) => {
  try {
    const deletedFaq = await Faq.findByIdAndDelete(req.params.id);
    if (!deletedFaq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ', details: error.message });
  }
}
}

export default faqController
