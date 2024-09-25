import Work from "../provider-work-model/provider.work.model.js";

const workController = {
  createWork : async (req, res) => {
    try {
      const { providerId, works } = req.body;
  
      // Create new Work document with providerId and works array
      const newWork = new Work({ providerId, works });
  
      // Save new work entry
      const savedWork = await newWork.save();
  
      // Respond with the saved work entry
      res.status(201).json(savedWork);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },


  getAllWork: async (req, res) => {
    try {
      const works = await Work.find()
      res.status(200).json(works);
    } catch (error) {
      console.error('Error fetching work:', error);
      res.status(500).json({ error: 'Error fetching work', details: error.message });
    }
  },

  updateWork: async (req, res) => {
    try {
      const { id } = req.params;
      const { works } = req.body;

      // Validate if works array is present and not empty
      if (!works || !works.length) {
        return res.status(400).json({ error: 'Missing works array in request body' });
      }

      // Update the entire works array
      const updatedWork = await Work.findByIdAndUpdate(
        id,
        { works },
        { new: true, runValidators: true }
      );

      if (!updatedWork) {
        return res.status(404).json({ message: 'Work not found' });
      }

      res.status(200).json(updatedWork);
    } catch (error) {
      console.error('Error updating work:', error);
      res.status(500).json({ error: 'Error updating work', details: error.message });
    }
  },

  deleteWork: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedWork = await Work.findByIdAndDelete(id);

      if (!deletedWork) {
        return res.status(404).json({ message: 'Work not found' });
      }

      res.status(200).json({ message: 'Work deleted successfully' });
    } catch (error) {
      console.error('Error deleting work:', error);
      res.status(500).json({ error: 'Error deleting work', details: error.message });
    }
  },
  getWorkByProviderId: async (req, res) => {
    try {
      const { providerId } = req.params;

      // Find works by providerId
      const works = await Work.find({ providerId });

      // Respond with the found works
      res.status(200).json(works);
    } catch (error) {
      console.error('Error fetching work by providerId:', error);
      res.status(500).json({ error: 'Error fetching work by providerId', details: error.message });
    }
  }

};

export default workController;
