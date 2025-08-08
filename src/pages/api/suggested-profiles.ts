import { NextApiRequest, NextApiResponse } from "next";
import { ddb } from '@/lib/aws-config'; 
import { QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

const USERS_TABLE = process.env.USERS_TABLE!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentUserId = req.query.userId as string;

  if (!currentUserId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    // 1. Get all user profiles
    const allUsersCommand = new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'begins_with(PK, :userPrefix) AND SK = :profile',
      ExpressionAttributeValues: {
        ':userPrefix': { S: 'USER#' },
        ':profile': { S: 'PROFILE' }
      }
    });
    const allUsersResult = await ddb.send(allUsersCommand);
    const allProfiles = allUsersResult.Items?.map(item => ({
      userId: item.userId.S!,
      username: item.username.S!,
      email: item.email.S!
    })) ?? [];

    // 2. Get following list
    const followingsCommand = new QueryCommand({
      TableName: USERS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :follow)',
      ExpressionAttributeValues: {
        ':pk': { S: `USER#${currentUserId}` },
        ':follow': { S: 'FOLLOW#' }
      }
    });
    const followingResult = await ddb.send(followingsCommand);
    const followedUserIds = new Set(
      followingResult.Items?.map(item => item.SK.S!.split("#")[1]) ?? []
    );

    // 3. Filter suggestions
    const suggestedProfiles = allProfiles.filter(profile =>
      profile.userId !== currentUserId && !followedUserIds.has(profile.userId)
    );

    res.status(200).json(suggestedProfiles);
  } catch (error) {
    console.error("Error fetching suggested profiles:", error);
    res.status(500).json({ error: "Server error" });
  }
}