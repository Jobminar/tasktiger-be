import ProviderDetails from '../model/provider.details.model.js';
import AWS from "aws-sdk";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadImageToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `images/${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (error) {
    throw new Error(`Error uploading image to S3: ${error.message}`);
  }
};

const deleteImageFromS3 = async (imageUrl) => {
  if (!imageUrl) return;

  const key = imageUrl.split('/').slice(-2).join('/');
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error(`Error deleting image from S3: ${error.message}`);
    throw new Error(`Error deleting image from S3: ${error.message}`);
  }
};

const providerDetailsController = {
  createProvider: async (req, res) => {
    try {
      upload.single('image')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: 'Image upload error', details: err.message });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'Image file is required' });
        }

        const s3Result = await uploadImageToS3(file);
        const imageUrl = s3Result;

        const { providerName, age, pincode, radius, providerId, gender, address, phone, isVerified } = req.body;

        const existingProvider = await ProviderDetails.findOne({ providerId });
        if (existingProvider) {
          return res.status(400).json({ message: 'Provider details already added', provider: existingProvider });
        }

        const newProvider = new ProviderDetails({
          providerName,
          image: imageUrl,
          age,
          pincode,
          radius,
          providerId,
          gender,
          address,
          phone,
          isVerified: isVerified || false, 
        });
        
        await newProvider.save();
        res.status(201).json(newProvider);        
      });
    } catch (error) {
      console.error('Error creating provider:', error);
      res.status(500).json({ error: 'Error creating provider', details: error.message });
    }
  },

  getAllProviders: async (req, res) => {
    try {
      const providers = await ProviderDetails.find();
      res.status(200).json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Internal server error", details: error });
    }
  },

  deleteProvider: async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await ProviderDetails.findById(id);

      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      await deleteImageFromS3(provider.image);
      await ProviderDetails.findByIdAndDelete(id);

      res.status(200).json({ message: "Provider deleted successfully" });
    } catch (error) {
      console.error("Error deleting provider:", error);
      res.status(500).json({ message: error.message });
    }
  },

  updateProviderId: async (req, res) => {
    try {
      upload.single('image')(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
          }
          return res.status(500).json({ message: 'Server error', error: err.message });
        }
  
        const { providerName, age, phone, pincode, radius, gender, address, isVerified } = req.body;
        const { providerId } = req.params;
  
        // Find the provider by providerId
        const provider = await ProviderDetails.findOne({ providerId });
        if (!provider) {
          return res.status(404).json({ message: 'Provider not found' });
        }
  
        // If a new file is uploaded, update the image field
        if (req.file) {
          // Delete the old image from S3
          if (provider.image) {
            await deleteImageFromS3(provider.image);
          }
  
          // Upload the new image to S3
          const newImageUrl = await uploadImageToS3(req.file);
          provider.image = newImageUrl;
        }
  
        // Update provider fields only if they are provided in the request body
        if (providerName !== undefined) provider.providerName = providerName;
        if (age !== undefined) provider.age = age;
        if (phone !== undefined) provider.phone = phone;
        if (pincode !== undefined) provider.pincode = pincode;
        if (radius !== undefined) provider.radius = radius;
        if (gender !== undefined) provider.gender = gender;
        if (address !== undefined) provider.address = address;
        if (isVerified !== undefined) provider.isVerified = isVerified;
  
        // Save the updated provider details
        const updatedProvider = await provider.save();
        res.status(200).json(updatedProvider);
      });
    } catch (error) {
      console.error('Error updating provider:', error);
      res.status(500).json({ message: 'Internal server error', details: error.message });
    }
  },
  

  updateProvider: async (req, res) => {
    try {
      upload.single('image')(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
          }
          return res.status(500).json({ message: 'Server error', error: err.message });
        }

        const { providerName, age, phone, pincode, radius, gender, address,isVerified } = req.body;
        const { id } = req.params;

        const provider = await ProviderDetails.findById(id);

        if (!provider) {
          return res.status(404).json({ message: 'Provider not found' });
        }

        // Handle image upload if a new image is provided
        if (req.file) {
          await deleteImageFromS3(provider.image);
          const newImageUrl = await uploadImageToS3(req.file);
          provider.image = newImageUrl;
        }

        // Update provider fields
        provider.providerName = providerName || provider.providerName;
        provider.age = age || provider.age;
        provider.phone = phone || provider.phone;
        provider.pincode = pincode || provider.pincode;
        provider.radius = radius || provider.radius;
        provider.gender = gender || provider.gender;
        provider.address = address || provider.address;
        provider.isVerified=isVerified || provider.isVerified
        const updatedProvider = await provider.save();
        res.status(200).json(updatedProvider);
      });
    } catch (error) {
      console.error('Error updating provider:', error);
      res.status(500).json({ message: 'Internal server error', details: error.message });
    }
  },

  getDetailsByProviderId: async (req, res) => {
    const { providerId } = req.params;

    try {
      const user = await ProviderDetails.findOne({ providerId });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ message: 'Internal server error', details: error.message });
    }
  },
};

export default providerDetailsController;
