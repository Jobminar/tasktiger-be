import Subadmin from '../model/sub-admin-model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: 'image', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]);

const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `subadmin/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Key;
};

const subadminController = {
  subAdminRegister: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: "Error uploading files." });
      }

      const {
        fullName,
        mobileNo,
        emailforCommunication,
        loginEmailId,
        password,
        dob,
        aadharNumber,
        pan,
        designation,
        experience,
        addressWithPincode,
        servingLocations,
        accountName,
        accountNumber,
        bankName,
        ifscCode,
        branchName,
        branchAddress
      } = req.body;

      try {
        const existingSubadmin = await Subadmin.findOne({ loginEmailId });
        if (existingSubadmin) {
          return res.status(400).json({ message: "Subadmin already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        let imageKey = '';
        let documentKeys = [];

        if (req.files.image) {
          imageKey = await uploadImageToS3(req.files.image[0]);
        }

        if (req.files.documents) {
          documentKeys = await Promise.all(
            req.files.documents.map((file) => uploadImageToS3(file))
          );
        }

        const newSubadmin = new Subadmin({
          fullName,
          mobileNo,
          emailforCommunication,
          loginEmailId,
          password: hashedPassword,
          dob,
          aadharNumber,
          pan,
          designation,
          experience,
          addressWithPincode,
          servingLocations,
          accountName,
          accountNumber,
          bankName,
          ifscCode,
          branchName,
          branchAddress,
          image: imageKey,
          documents: documentKeys
        });

        await newSubadmin.save();

        res.status(201).json({ message: "Subadmin registered successfully." });
      } catch (error) {
        console.log(error, 'error');
        res.status(500).json({ message: "Something went wrong." });
      }
    });
  },

  subAdminLogin: async (req, res) => {
    const { loginEmailId, password } = req.body;

    try {
      const subadmin = await Subadmin.findOne({ loginEmailId });
      if (!subadmin) {
        return res.status(404).json({ message: "Subadmin not found." });
      }

      const isPasswordCorrect = await bcrypt.compare(password, subadmin.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid credentials." });
      }

      const token = jwt.sign({ id: subadmin._id, loginEmailId: subadmin.loginEmailId }, 'secret', { expiresIn: '1h' });

      res.status(200).json({ result: token, id: subadmin._id });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong." });
    }
  },
  getAllSubAdmins: async (req, res) => {
    try {
      const subadmins = await Subadmin.find();
      res.status(200).json(subadmins);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to retrieve sub-admins." });
    }
  },
  updateSubadmin: async (req, res) => {
    const subadminId = req.params.id;
    const updateFields = req.body;
    try {
      const updatedSubadmin = await Subadmin.findByIdAndUpdate(subadminId, updateFields, { new: true });
      res.status(200).json(updatedSubadmin);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update subadmin." });
    }
  },
};

export default subadminController;
