import ProviderDate from '../model/provider.date.model.js' // Adjust the path as per your file structure

const providerDateController = {
  // Controller to create a new date entry
  createDateController: async (req, res) => {
    try {
      const {service, providerId, date, work, time } = req.body;

      // Validate input data
      if (!service || !providerId || !date) {
        return res.status(400).json({ message: "Please provide providerId, date, and time" });
      }

      // Create new ProviderDate object
      const newDateEntry = new ProviderDate({
        service,
        providerId,
        date,
        work: work || false, // Default to false if not provided
        time,
      });

      // Save to database
      const savedDate = await newDateEntry.save();

      // Respond with the saved entry
      res.status(201).json(savedDate);
    } catch (error) {
      console.error("Error creating date entry:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Controller to get all date entries
  getAllDatesController: async (req, res) => {
    try {
      const dates = await ProviderDate.find();
      res.json(dates);
    } catch (error) {
      console.error("Error retrieving dates:", error);
      res.status(500).json({ message: error.message });
    }
  },
  
  getDateByproviderId: async (req, res) => {
    try {
      const { id: providerId } = req.params; 

      if (!providerId) {
        return res.status(400).json({ message: 'Missing required field: providerId' });
      }

      const date = await ProviderDate.find({ providerId }); 

      if (!date.length) {
        return res.status(404).json({ message: 'No date found for this user' });
      }

      res.status(200).json(date);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get date', error: error.message });
    }
  },  
  
  deleteDateController: async (req, res) => {
    try {
      const { service, providerId, date, work } = req.body;

      // Validate input data
      if (!service || !providerId || !date || work === undefined) {
        return res.status(400).json({ message: "Please provide service, providerId, date, and work" });
      }

      // Find and delete the entry
      const dateEntry = await ProviderDate.findOneAndDelete({ service, providerId, date, work });

      if (!dateEntry) {
        return res.status(404).json({ message: "Date entry not found" });
      }

      res.status(200).json({ message: "Date entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting date entry:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

export default providerDateController;
