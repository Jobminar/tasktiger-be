import { BlobServiceClient } from '@azure/storage-blob';
import UserPromotions from '../user-promotions-model/user.promotion.model.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

const createContainerIfNotExists = async () => {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
};

createContainerIfNotExists();

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

const uploadImageToAzure = async (file) => {
    const fileExtension = path.extname(file.originalname);
    const blobName = `${uuidv4()}${fileExtension}`;
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return blockBlobClient.url; // Return the Azure Blob URL
};

const deleteImageFromAzure = async (imageUrl) => {
    const blobName = imageUrl.split('/').pop();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();
};

// User Promotions controller
const userPromotionsController = {
  createPromotion: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      try {
        const { title, subTitle, descriptionHeading, description, validity, validFrom, validTill, minCartValue, comments, notifyUsers } = req.body;

        // Validate required fields
        if (!title || !validity || !minCartValue || !comments || !req.file || !validFrom || !validTill) {
          return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Upload image to Azure Blob Storage
        const imageUrl = await uploadImageToAzure(req.file);

        // Create new user promotion record
        const promotion = new UserPromotions({
          title,
          subTitle,
          descriptionHeading,
          description,
          image: imageUrl, // Store the image URL
          validity,
          validFrom,
          validTill,
          minCartValue,
          notifyUsers: notifyUsers || false, // Optional field
          couponCode: uuidv4(), // Generate coupon code
          comments,
        });

        const savedPromotion = await promotion.save();
        res.status(201).json(savedPromotion);
      } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ message: 'Internal server error', error });
      }
    });
  },

  getUserPromotions: async (req, res) => {
    try {
      const promotions = await UserPromotions.find();
      res.status(200).json(promotions);
    } catch (error) {
      console.error('Error retrieving promotions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getPromotionById: async (req, res) => {
    try {
      const promotion = await UserPromotions.findById(req.params.id);
      if (!promotion) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
      res.status(200).json(promotion);
    } catch (error) {
      console.error('Error retrieving promotion by ID:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deletePromotion: async (req, res) => {
    try {
      const promotion = await UserPromotions.findById(req.params.id);
      if (!promotion) {
        return res.status(404).json({ message: 'Promotion not found' });
      }

      // Delete the image from Azure Blob Storage
      await deleteImageFromAzure(promotion.image);

      await promotion.deleteOne();
      res.status(200).json({ message: 'Promotion deleted successfully' });
    } catch (error) {
      console.error('Error deleting promotion:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updatePromotion: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      try {
        const { title, subTitle, descriptionHeading, description, validity, validFrom, validTill, minCartValue, comments, notifyUsers } = req.body;

        if (!title || !validity || !minCartValue || !comments || !validFrom || !validTill) {
          return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const promotion = await UserPromotions.findById(req.params.id);
        if (!promotion) {
          return res.status(404).json({ message: 'Promotion not found' });
        }

        // Update fields
        promotion.title = title;
        promotion.subTitle = subTitle;
        promotion.descriptionHeading = descriptionHeading;
        promotion.description = description;
        promotion.validity = validity;
        promotion.validFrom = validFrom;
        promotion.validTill = validTill;
        promotion.minCartValue = minCartValue;
        promotion.comments = comments;
        promotion.notifyUsers = notifyUsers || promotion.notifyUsers;

        if (req.file) {
          // Upload new image to Azure
          const newImageUrl = await uploadImageToAzure(req.file);

          // Delete the old image from Azure Blob Storage
          await deleteImageFromAzure(promotion.image);

          promotion.image = newImageUrl; // Update image URL with the new one
        }

        const updatedPromotion = await promotion.save();
        res.status(200).json(updatedPromotion);
      } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  },
};

export default userPromotionsController;
