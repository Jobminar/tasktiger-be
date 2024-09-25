
// import AWS from "aws-sdk";
// const imageUpload = async (base64) => {
//   // You can either "yarn add aws-sdk" or "npm i aws-sdk"

//   // Configure AWS with your access and secret key.
//   const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME} = process.env;

//   // Configure AWS to use promise
//   // AWS.config.setPromisesDependency(require('bluebird'));

//   AWS.config.update({
//     accessKeyId: AWS_ACCESS_KEY_ID,
//     secretAccessKey: AWS_SECRET_ACCESS_KEY,
//     region: AWS_REGION,
//   });

//   // Create an s3 instance
//   const s3 = new AWS.S3();

//   // Ensure that you POST a base64 data to your server.
//   // Let's assume the variable "base64" is one.
//   const base64Data = new Buffer.from(
//     base64.replace(/^data:image\/\w+;base64,/, ""),
//     "base64",
//   );

//   // Getting the file type, ie: jpeg, png or gif
//   const type = base64.split(";")[0].split("/")[1];

//   // Generally we'd have an userId associated with the image
//   // For this example, we'll simulate one
//   const userId =5

//   // With this setup, each time your user uploads an image, will be overwritten.
//   // To prevent this, use a different Key each time.
//   // This won't be needed if they're uploading their avatar, hence the filename, userAvatar.js.
//   const params = {
//     Bucket: AWS_BUCKET_NAME,
//     Key: `${userId}.${type}`, // type is not required
//     Body: base64Data,
//     ACL: "public-read", //  remove 37 line auto  private
//     ContentEncoding: "base64", // required
//     ContentType: `image/${type}`, // required. Notice the back ticks
//   };

//   // The upload() is used instead of putObject() as we'd need the location url and assign that to our user profile/database
//   // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
//   let location = "";
//   let key = "";
//   try {
//     const { Location, Key } = await s3.upload(params).promise();
//     location = Location;
//     key = Key;
//   } catch (error) {
//     console.log(error);
//   }

//   // Save the Location (url) to your database and Key if needs be.
//   // As good developers, we should return the url and let other function do the saving to database etc
//   console.log(location, key);

//   return location;

//   // To delete, see: https://gist.github.com/SylarRuby/b3b1430ca633bc5ffec29bbcdac2bd52
// };

// export { imageUpload };


// import AWS from "aws-sdk";
// import dotenv from "dotenv";
// import { v4 as uuidv4 } from 'uuid';
// import path from 'path';

// dotenv.config();

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// export const imageUpload = async (file) => {
//   const fileExtension = path.extname(file.originalname);
//   const imageKey = `sub-categories/${uuidv4()}${fileExtension}`;

//   const s3Params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: imageKey,
//     Body: file.buffer,
//     ACL: 'public-read',
//     ContentType: file.mimetype,
//   };

//   const uploadResult = await s3.upload(s3Params).promise();
//   return uploadResult.Key;
// };
