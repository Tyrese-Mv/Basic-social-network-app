import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/lib/auth';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { ddb } from '@/lib/aws-config';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    
    
    if (req.method != "GET"){
        return res.status(401).json({  message: `Method ${req.method} Not Allowed` })
    }

    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const command = new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': { S: `USER#${user.email}` },
          ':sk': { S: 'POST#' },
        },
    });
    
    try {
        const result = await ddb.send(command);
        const posts = result.Items?.map((item) => unmarshall(item)) || [];
        res.status(200).json({ posts });
    } catch (err) {
        console.error('Get Posts Error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}