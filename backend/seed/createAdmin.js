require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ email: 'admin@siteflow.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit();
    }

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@siteflow.com',
      password: 'Admin@123',   // yaha apna password daal sakti ho
      role: 'admin',
    });

    console.log('Admin created successfully:', admin.email);
    process.exit();
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();