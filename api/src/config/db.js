import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }
  await mongoose.connect(uri);

  // Ensure stale unique indexes are removed and current schema indexes are applied.
  await Product.syncIndexes();

  console.log('MongoDB connected');
};
