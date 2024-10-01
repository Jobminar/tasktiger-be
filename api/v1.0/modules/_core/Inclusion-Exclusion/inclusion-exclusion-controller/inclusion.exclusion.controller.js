import InclusionExclusion from '../inclusion-exclusion-model/inclusion.exclusion.model.js';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING; // Set your connection string in environment variables
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME; // Container name from .env

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

const upload = multer({ storage: multer.memoryStorage() });

const inclusionExclusionController = {

  // Upload image to Azure
  uploadImageToAzure: async (file, folder) => {
    const blobName = `${folder}/${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return blockBlobClient.url; // Return the URL of the uploaded image
  },

  // Delete image from Azure
  deleteImageFromAzure: async (imageUrl) => {
    const blobName = imageUrl.split('/').pop(); // Extract blob name from URL
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists(); // Delete the blob if it exists
  },

  // Create InclusionExclusion entry
  createInclusionExclusion: [
    upload.fields([
      { name: 'bannerImage', maxCount: 1 },
      { name: 'listOfItems', maxCount: 10 }, // Assuming up to 10 icon images
    ]),
    async (req, res) => {
      try {
        const { serviceId, title, featureTitle, description, exclusions, listOfItems } = req.body;

        // Check if banner image is provided
        if (!req.files.bannerImage || req.files.bannerImage.length === 0) {
          return res.status(400).json({ error: 'Banner image is required' });
        }

        // Upload banner image
        const bannerImageUpload = await inclusionExclusionController.uploadImageToAzure(req.files.bannerImage[0], 'inclusion-exclusion');

        // Process list of items with icon images
        const parsedListOfItems = JSON.parse(listOfItems);
        const processedListOfItems = await Promise.all(
          parsedListOfItems.map(async (item, index) => {
            // Ensure that the iconImage file exists before uploading
            if (req.files.listOfItems && req.files.listOfItems[index]) {
              const iconImageUpload = await inclusionExclusionController.uploadImageToAzure(req.files.listOfItems[index], 'inclusion-exclusion'); // Specify the folder here
              return {
                title: item.title,
                iconImage: iconImageUpload,
              };
            } else {
              // Handle case where no new icon image is uploaded
              return {
                title: item.title,
                iconImage: null, // or keep the old image if necessary
              };
            }
          })
        );

        // Create new InclusionExclusion entry
        const newEntry = new InclusionExclusion({
          serviceId,
          title,
          bannerImage: bannerImageUpload,
          featureTitle,
          listOfItems: processedListOfItems,
          exclusions: JSON.parse(exclusions),
          description,
        });

        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
      } catch (error) {
        console.error('Error creating inclusion/exclusion entry:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  ],

  // Get all InclusionExclusion entries
  getAllInclusionExclusion: async (req, res) => {
    try {
      const entries = await InclusionExclusion.find().populate('serviceId');
      res.status(200).json(entries);
    } catch (error) {
      console.error('Error fetching inclusion/exclusion entries:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },

  getInclusionExclusionByServiceId: async (req, res) => {
    try {
      const { serviceId } = req.params; // Get serviceId from request parameters

      // Find all entries for the given serviceId
      const entries = await InclusionExclusion.find({ serviceId }).populate('serviceId'); // Populating serviceId if needed

      // Check if entries were found
      if (entries.length === 0) {
        return res.status(404).json({ message: 'No inclusion/exclusion entries found for this service ID.' });
      }

      res.status(200).json(entries); // Return the found entries
    } catch (error) {
      console.error('Error fetching inclusion/exclusion entries by service ID:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },

  // Update InclusionExclusion entry
  updateInclusionExclusion: [
    upload.fields([
      { name: 'bannerImage', maxCount: 1 },
      { name: 'listOfItems', maxCount: 10 }, // Assuming up to 10 icon images
    ]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { title, featureTitle, description, exclusions, listOfItems } = req.body;

        // Find the existing entry
        const existingEntry = await InclusionExclusion.findById(id);
        if (!existingEntry) {
          return res.status(404).json({ error: 'Entry not found' });
        }

        // Update banner image if provided
        if (req.files.bannerImage && req.files.bannerImage[0]) {
          const bannerImageUpload = await inclusionExclusionController.uploadImageToAzure(req.files.bannerImage[0], 'inclusion-exclusion'); // Specify the folder here

          // Optionally delete the old banner image from Azure
          if (existingEntry.bannerImage) {
            await inclusionExclusionController.deleteImageFromAzure(existingEntry.bannerImage);
          }

          existingEntry.bannerImage = bannerImageUpload;
        }

        // Update list of items with new icon images if provided
        if (req.files.listOfItems && listOfItems) {
          const parsedListOfItems = JSON.parse(listOfItems);
          const processedListOfItems = await Promise.all(
            parsedListOfItems.map(async (item, index) => {
              if (req.files.listOfItems[index]) {
                const iconImageUpload = await inclusionExclusionController.uploadImageToAzure(req.files.listOfItems[index], 'inclusion-exclusion'); // Specify the folder here

                // Optionally delete the old icon image from Azure
                if (existingEntry.listOfItems[index] && existingEntry.listOfItems[index].iconImage) {
                  await inclusionExclusionController.deleteImageFromAzure(existingEntry.listOfItems[index].iconImage);
                }

                return {
                  title: item.title,
                  iconImage: iconImageUpload,
                };
              } else {
                // Keep the existing icon image if no new file is uploaded
                return existingEntry.listOfItems[index];
              }
            })
          );
          existingEntry.listOfItems = processedListOfItems;
        }

        // Update other fields if provided
        if (title) existingEntry.title = title;
        if (featureTitle) existingEntry.featureTitle = featureTitle;
        if (description) existingEntry.description = description;
        if (exclusions) existingEntry.exclusions = JSON.parse(exclusions);

        // Save the updated entry
        const updatedEntry = await existingEntry.save();
        res.status(200).json(updatedEntry);
      } catch (error) {
        console.error('Error updating inclusion/exclusion entry:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  ],

  // Delete InclusionExclusion entry
  deleteInclusionExclusion: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the entry
      const entry = await InclusionExclusion.findById(id);
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      // Delete banner image from Azure
      if (entry.bannerImage) {
        await inclusionExclusionController.deleteImageFromAzure(entry.bannerImage);
      }

      // Delete all icon images from Azure
      for (const item of entry.listOfItems) {
        if (item.iconImage) {
          await inclusionExclusionController.deleteImageFromAzure(item.iconImage);
        }
      }

      // Delete the entry from the database
      await InclusionExclusion.findByIdAndDelete(id);
      res.status(204).send(); // No content
    } catch (error) {
      console.error('Error deleting inclusion/exclusion entry:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },
};

export default inclusionExclusionController;
