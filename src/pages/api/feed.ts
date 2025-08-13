import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/lib/auth';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { ddb } from '@/lib/aws-config';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { Post } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    
    
    if (req.method != "GET"){
        return res.status(401).json({  message: `Method ${req.method} Not Allowed` })
    }

    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const USERS_TABLE = process.env.USERS_TABLE as string;

    try {
        // 1) Fetch the list of userIds that the current user follows
        const followingQuery = new QueryCommand({
            TableName: USERS_TABLE,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': { S: `USER#${user.userId}` },
                ':sk': { S: 'FOLLOW#' },
            },
            ProjectionExpression: 'SK',
        });

        const followingResult = await ddb.send(followingQuery);
        const followedUserIds = (followingResult.Items || [])
            .map((item) => (item.SK && 'S' in item.SK ? (item.SK.S as string) : ''))
            .map((sk) => sk.split('#')[1])
            .filter((id): id is string => Boolean(id));
        console.log(followedUserIds)

        if (followedUserIds.length === 0) {
            return res.status(200).json({ posts: [] });
        }

        // 2) Fetch posts for each followed user
        const postQueryPromises = followedUserIds.map((followedId) =>
            ddb.send(
                new QueryCommand({
                    TableName: USERS_TABLE,
                    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                    ExpressionAttributeValues: {
                        ':pk': { S: `USER#${followedId}` },
                        ':sk': { S: 'POST#' },
                    },
                })
            )
        );

        const postResults = await Promise.all(postQueryPromises);
        const allItems = postResults.flatMap((r) => r.Items || []);
        const posts: Post[] = allItems.map((item) => unmarshall(item) as Post);

        // 3) Sort by timestamp descending (newest first)
        posts.sort((a: Post, b: Post) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

        return res.status(200).json({ posts });
    } catch {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}