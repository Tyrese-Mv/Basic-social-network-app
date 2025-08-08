import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/lib/auth';


import { PutCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '@/lib/aws-config';
// import { unmarshall } from '@aws-sdk/util-dynamodb';

const USERS_TABLE = process.env.USERS_TABLE!;

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    const user = getUserFromRequest(req);

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });

    }
    const profileId = req.query.ProfileID as string
    const loggedInUserId = getUserFromRequest(req)?.userId;

    if (!profileId) {
        return res.status(400).json({ message: 'Missing ProfileID' });
    }
    
    // if (profileId === loggedInUserId) {
    //     return res.status(400).json({ message: 'Cannot follow yourself' });
    // }

    const followKey = {
        PK: `USER#${loggedInUserId}`,
        SK: `FOLLOW#${profileId}`
    };
    const followerKey = {
        PK: `USER#${profileId}`,
        SK: `FOLLOW#${loggedInUserId}`
    };
    
    try {
        if (req.method === 'POST') {
            await ddb.send(
                new PutCommand({
                TableName: USERS_TABLE,
                Item: {
                    ...followKey,
                    itemType: 'FOLLOW',
                    timestamp: Date.now()
                    }
                })
            );
            await ddb.send(
                new PutCommand({
                TableName: USERS_TABLE,
                Item: {
                    ...followerKey,
                    itemType: 'FOLLOWER',
                    timestamp: Date.now()
                    }
                })
            );
            return res.status(200).json({ message: 'Followed successfully' });
        } 
        
        else if (req.method === 'DELETE') {
            await ddb.send(
                new DeleteCommand({
                    TableName: USERS_TABLE,
                    Key: followKey
                })
            );
            await ddb.send(
                new DeleteCommand({
                    TableName: USERS_TABLE,
                    Key: followerKey
                })
            );
            return res.status(200).json({ message: 'Unfollowed successfully' });
        }
    
        else if (req.method === 'GET') {
            const result = await ddb.send(
                new GetCommand({
                    TableName: USERS_TABLE,
                    Key: followKey
                })
            );
            const isFollowing = !!result.Item;
            return res.status(200).json({ isFollowing });
        }
    
        else {
            return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error', error });
    }
}