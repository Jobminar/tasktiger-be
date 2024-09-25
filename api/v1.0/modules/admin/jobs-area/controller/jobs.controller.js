import Jobs from "../model/jobs.model.js";

const jobsController = {
  createJob: async (req, res) => {
    try {
      const { adminId, category, subCategory, subService, date, time } =
        req.body;

      if (!adminId || !category || !subCategory || !subService || !date || !time) {
        return res.status(400).json({ message: "Required fields is missing !!" });
      }

      const newJob = new Jobs({
        adminId,
        category,
        subCategory,
        subService,
        date,
        time,
      });

      const savedJob = await newJob.save();

      res.status(201).json(savedJob);
    } catch (error) {
      res.status(500).json({ error: "Internal server error", details: error });
    }
  },
  getAllJobs: async (req, res) => {
    try {
      const getData = await Jobs.find();
      res.status(200).json(getData);
    } catch (error) {
      res.status(500).json({ error: "Failed to get all data", details: error });
    }
  },
  deleteJob: async (req, res) => {
    try {
      const { id } = req.params;
      const removeItem = await Jobs.findByIdAndDelete(id);
      if (!removeItem) {
        return res.status(404).json({ message: "Item not found id" });
      }
      res.status(200).json(removeItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete !!", details: error });
    }
  },
  getAdminById: async (req, res) => {
    try {
      const { id: adminId } = req.params;

      if (!adminId) {
        return res
          .status(400)
          .json({ message: "Missing required field: adminId" });
      }
      const admin = await Jobs.find({ adminId });

      if (!admin.length) {
        return res.status(404).json({ message: "No id found for this admin" });
      }

      res.status(200).json(admin);
    } catch (error) {
      res.status(500).json({ error: "Failed to get data !!" });
    }
  },
};
export default jobsController;
