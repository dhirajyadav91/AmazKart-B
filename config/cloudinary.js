// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    // Test the connection by making a simple API call
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully!');
    console.log(`📁 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`🔑 API Key: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`🔒 API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log('🚀 Cloudinary is ready to use!');
  } catch (error) {
    console.log('❌ Cloudinary connection failed!');
    console.log('📋 Error details:', error.message || error);
    if (error.code) console.log('🔢 Error code:', error.code);
    if (error.http_code) console.log('🌐 HTTP code:', error.http_code);
    console.log('🔧 Please check your Cloudinary credentials in .env file');

    // Check which credentials are missing
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('❌ CLOUDINARY_CLOUD_NAME is missing in .env');
    }
    if (!process.env.CLOUDINARY_API_KEY) {
      console.log('❌ CLOUDINARY_API_KEY is missing in .env');
    }
    if (!process.env.CLOUDINARY_API_SECRET) {
      console.log('❌ CLOUDINARY_API_SECRET is missing in .env');
    }
  }
};

// Call the connection test
testCloudinaryConnection();

export default cloudinary;