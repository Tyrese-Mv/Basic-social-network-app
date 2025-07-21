import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/lib/auth';
import { ddb } from '@/lib/aws-config';
import { v4 as uuidv4 } from 'uuid';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';



export default async function handler(req: NextApiRequest, res: NextApiResponse){
    if (req.method !== 'POST') {
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
      }
    
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    
      const { content } = req.body;
      const postId = uuidv4();
      const timestamp = Date.now();
    
      const command = new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          PK: { S: `USER#${user.email}` },
          SK: { S: `POST#${postId}` },
          content: { S: content },
        //   imageUrl: imageUrl ? { S: imageUrl } : { NULL: true },
          timestamp: { N: timestamp.toString() },
          itemType: { S: 'POST' }
        },
      });
    
      try {
        await ddb.send(command);
        return res.status(201).json({ postId, message: 'Post created' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to create post' });
      }
}