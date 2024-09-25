import { upload, uploadImageToS3 } from '../aws.auth.image.js';
import Chandra from "./chandraModel.js";

const chandraController = {
  createChandra: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Error uploading file", error: err });
      }

      const { name } = req.body;
      const image = req.file;

      // Validate input
      if (!name || !image) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      try {
        const imageUrl = await uploadImageToS3(image, 'chandra'); 
        const newChandra = new Chandra({
          name,
          image: imageUrl,
        });

        const savedChandra = await newChandra.save();
        res.status(201).json(savedChandra);
      } catch (error) {
        console.error("Database save error:", error);
        res.status(500).json({ message: "Internal server error", details: error });
      }
    });
  },

  getAllChandra: async (req, res) => {
    try {
      const chandraList = await Chandra.find();
      res.status(200).json(chandraList);
    } catch (error) {
      console.error("Database query error:", error);
      res.status(500).json({ message: "Internal server error", details: error });
    }
  },
};

export default chandraController;
