import bcrypt from 'bcrypt';
import { connectToDatabase } from '../../db/dbConnect';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Invalid request method' });
    return;
  }

  const { login, password } = req.body;

  if (!login || !password) {
    res.status(400).json({ message: 'Login and password are required' });
    return;
  }

  try {
    const client = await connectToDatabase(process.env.MONGODB_URI);
    const usersCollection = client.db("kfc").collection("users");
    const cartCollection = client.db("kfc").collection("cart"); 

    const userExists = await usersCollection.findOne({ login });

    if (userExists) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await usersCollection.insertOne({ login, password: hashedPassword, favorites: [] });

    await cartCollection.insertOne({ userId: result.insertedId, cartItems: [] });

    res.status(201).json({ message: 'User created', userId: result.insertedId });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
