import InclusionExclusion from '../inclusion-exclusion-model/inclusion.exclusion.model.js';
import AWS from 'aws-sdk';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload images to S3
const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `inclusion-exclusion/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Location;
};

const inclusionExclusionController = {
  // Create InclusionExclusion entry
  createInclusionExclusion: [
    upload.fields([
      { name: 'bannerImage', maxCount: 1 },
      { name: 'listOfItems', maxCount: 10 }, // Assuming up to 10 icon images
    ]),
    async (req, res) => {
      try {
        const { serviceId, title, featureTitle, description, exclusions, listOfItems } = req.body;

        // Upload banner image
        const bannerImageUpload = await uploadImageToS3(req.files.bannerImage[0]);

        // Process list of items with icon images
        const processedListOfItems = JSON.parse(listOfItems).map(async (item, index) => {
          const iconImageUpload = await uploadImageToS3(req.files.listOfItems[index]);
          return {
            title: item.title,
            iconImage: iconImageUpload,
          };
        });

        const resolvedListOfItems = await Promise.all(processedListOfItems);

      
        const newEntry = new InclusionExclusion({
          serviceId,
          title,
          bannerImage: bannerImageUpload,
          featureTitle,
          listOfItems: resolvedListOfItems,
          exclusions: JSON.parse(exclusions), 
          description,
        });

        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
      } catch (error) {
        res.status(500).json({ error:"Internal server error",details:error });
      }
    }
  ],


  getAllInclusionExclusion: async (req, res) => {
    try {
      const entries = await InclusionExclusion.find().populate('serviceId');
      res.status(200).json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  updateInclusionExclusion: [
    upload.fields([
      { name: 'bannerImage', maxCount: 1 },
      { name: 'listOfItems', maxCount: 10 }, // Assuming up to 10 icon images
    ]),
    async (req, res) => {
      try {
        const { id } = req.params; // The ID of the document to update
        const { title, featureTitle, description, exclusions, listOfItems } = req.body;

        // Find the existing entry
        const existingEntry = await InclusionExclusion.findById(id);
        if (!existingEntry) {
          return res.status(404).json({ error: 'Entry not found' });
        }

        // Update banner image if provided
        if (req.files.bannerImage) {
          existingEntry.bannerImage = await uploadImageToS3(req.files.bannerImage[0]);
        }

        // Process and update list of items if provided
        if (req.files.listOfItems) {
          const processedListOfItems = JSON.parse(listOfItems).map(async (item, index) => {
            const iconImageUpload = await uploadImageToS3(req.files.listOfItems[index]);
            return {
              title: item.title,
              iconImage: iconImageUpload,
            };
          });

          existingEntry.listOfItems = await Promise.all(processedListOfItems);
        }

        // Update other fields
        existingEntry.title = title || existingEntry.title;
        existingEntry.featureTitle = featureTitle || existingEntry.featureTitle;
        existingEntry.description = description || existingEntry.description;
        existingEntry.exclusions = JSON.parse(exclusions) || existingEntry.exclusions;

        // Save the updated entry
        const updatedEntry = await existingEntry.save();
        res.status(200).json(updatedEntry);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  ],
  deleteInclusionExclusion: async (req, res) => {
    try {
      const { id } = req.params; // The ID of the document to delete

      // Find and delete the entry
      const deletedEntry = await InclusionExclusion.findByIdAndDelete(id);
      if (!deletedEntry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.status(200).json({ message: 'Entry successfully deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getInclusionExclusionByServiceId: async (req, res) => {
    try {
      const { serviceId } = req.params; 
  
      const entry = await InclusionExclusion.findOne({ serviceId }).populate('serviceId');

      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }
  
      res.status(200).json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
};

export default inclusionExclusionController;
