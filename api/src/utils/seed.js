import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';

const jockeyProducts = [
  {
    name: 'Jockey US-101 Brief',
    barcode: '8901033010101',
    category: 'men',
    color: 'Black',
    size: 'M',
    price: 349,
    costPrice: 210,
    quantity: 24,
    lowStockThreshold: 6,
  },
  {
    name: 'Jockey US-101 Brief',
    barcode: '8901033010102',
    category: 'men',
    color: 'Black',
    size: 'L',
    price: 349,
    costPrice: 210,
    quantity: 18,
    lowStockThreshold: 6,
  },
  {
    name: 'Jockey ELANCE Bikini',
    barcode: '8901033020201',
    category: 'women',
    color: 'Skin',
    size: 'M',
    price: 299,
    costPrice: 175,
    quantity: 20,
    lowStockThreshold: 5,
  },
  {
    name: 'Jockey Girls Camisole',
    barcode: '8901033030301',
    category: 'kids',
    color: 'White',
    size: '8-9 Y',
    price: 249,
    costPrice: 145,
    quantity: 15,
    lowStockThreshold: 4,
  },
  {
    name: 'Jockey Home Bath Towel',
    barcode: '8901033040401',
    category: 'towels',
    color: 'Navy',
    size: '75x150 cm',
    price: 899,
    costPrice: 520,
    quantity: 12,
    lowStockThreshold: 3,
  },
  {
    name: 'Jockey Ankle Socks (Pack of 3)',
    barcode: '8901033050501',
    category: 'socks',
    color: 'Assorted',
    size: 'Free',
    price: 399,
    costPrice: 240,
    quantity: 30,
    lowStockThreshold: 8,
  },
  {
    name: 'Jockey Thermal Top',
    barcode: '8901033060601',
    category: 'thermals',
    color: 'Grey',
    size: 'L',
    price: 1299,
    costPrice: 780,
    quantity: 10,
    lowStockThreshold: 3,
  },
  {
    name: 'Jockey Sport Performance T-Shirt',
    barcode: '8901033070701',
    category: 'others',
    color: 'Royal Blue',
    size: 'XL',
    price: 599,
    costPrice: 360,
    quantity: 14,
    lowStockThreshold: 4,
  },
  {
    name: 'Jockey Modern Trunk',
    barcode: '8901033010103',
    category: 'men',
    color: 'Navy',
    size: 'M',
    price: 449,
    costPrice: 270,
    quantity: 22,
    lowStockThreshold: 6,
  },
  {
    name: 'Jockey Bralette',
    barcode: '8901033020202',
    category: 'women',
    color: 'Rose',
    size: 'S',
    price: 549,
    costPrice: 330,
    quantity: 16,
    lowStockThreshold: 4,
  },
];

const seed = async () => {
  await connectDB();

  const onlyProducts = process.argv.includes('--products-only');

  await Product.deleteMany({});

  let admin;

  if (onlyProducts) {
    admin = await User.findOne({ email: 'admin@mahalaxmi.com' });
    if (!admin) {
      throw new Error('No admin user found. Run full seed first: npm run seed');
    }
  } else {
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Invoice.deleteMany({});

    admin = await User.create({
      name: 'Store Admin',
      email: 'admin@mahalaxmi.com',
      password: 'admin123',
      role: 'admin',
    });

    await User.create({
      name: 'Sales Staff',
      email: 'employee@mahalaxmi.com',
      password: 'employee123',
      role: 'employee',
    });

    await Customer.insertMany([
      {
        name: 'Walk-in Customer',
        phone: '9999999999',
        city: 'Showroom',
        createdBy: admin._id,
      },
      {
        name: 'Priya Mehta',
        phone: '9876543210',
        email: 'priya@example.com',
        address: '12 Linking Road',
        city: 'Mumbai',
        createdBy: admin._id,
      },
    ]);
  }

  const products = await Product.insertMany(
    jockeyProducts.map((p) => ({ ...p, createdBy: admin._id }))
  );

  console.log('Seed completed successfully');
  console.log('Jockey product catalog:', products.length, 'items');
  if (!onlyProducts) {
    console.log('Admin: admin@mahalaxmi.com / admin123');
    console.log('Employee: employee@mahalaxmi.com / employee123');
  }

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
