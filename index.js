// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Initialize Express and MongoDB client
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASS}@cluster0.c5ebkxr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error(err);
  }
}

connectDB();

const db = client.db('scicjobtaskDB');
const productCollection = db.collection('productAll');

// Get products with pagination, searching, categorization, and sorting
app.get('/productAll', async (req, res) => {
  try {
    const { page = 1, limit = 40, search = '', category = '', brand = '', minPrice = 0, maxPrice = Infinity, minRating = 0, sort = 'createdAt', order = 'desc' } = req.query;

    const filter = {
      name: { $regex: search, $options: 'i' },
      category: { $regex: category, $options: 'i' },
      brand: { $regex: brand, $options: 'i' },
      price: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) },
      ratings: { $gte: parseFloat(minRating) }
    };

    const products = await productCollection.find(filter)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();

    const totalProducts = await productCollection.countDocuments(filter);

    res.json({
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});



// Insert dummy product data (run once)
app.post('/productALl/dummy', async (req, res) => {
  try {
    const dummyProducts = Array.from({ length: 40 }, (_, index) => ({
      name: `Product ${index + 1}`,
      image: `https://via.placeholder.com/150?text=Product+${index + 1}`,
      description: `Description for Product ${index + 1}`,
      price: (Math.random() * 100).toFixed(2),
      category: 'Category1',
      brand: 'Brand1',
      ratings: (Math.random() * 5).toFixed(1),
      createdAt: new Date()
    }));

    await productCollection.insertMany(dummyProducts);
    res.status(201).send('Dummy products added');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/', (req, res) => {
  res.send('Hello from A11 Server....');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
