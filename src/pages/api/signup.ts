import { NextApiRequest, NextApiResponse } from "next";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws-config";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  const createdAt = new Date().toISOString();

  const newUser = {
    PK: `USER#${userId}`,
    SK: "PROFILE",
    userId,
    email,
    username,
    hashedPassword,
    createdAt,
  };

  try {
    await ddb.send(new PutCommand({
      TableName: "SocialApp",
      Item: newUser,
      ConditionExpression: "attribute_not_exists(PK)" // prevent overwriting
    }));

    return res.status(201).json({ message: "User created", userId });
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") {
      return res.status(409).json({ error: "User already exists" });
    }
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}