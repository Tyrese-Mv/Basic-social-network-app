import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

///Gonna replace it with DynamoDB
import { ddb } from '@/lib/aws-config'; // your configured DocumentClient
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
// const users: { email: string; passwordHash: string }[] = [];

const USERS_TABLE = process.env.USERS_TABLE!;
const JWT_SECRET = process.env.JWT_SECRET!;


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  
    const { email, password } = req.body;
  
    try {
      
      const query = new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
        Limit: 1,
      });
  
      const result = await ddb.send(query);
      const user = result.Items?.[0];
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      console.log(user)
      const isMatch = await bcrypt.compare(password, user.hashedPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, {
        expiresIn: '100h',
      });
  
      return res.status(200).json({ token });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Something went wrong during login.' });
    }
  }