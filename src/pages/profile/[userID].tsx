import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { checkFollow, createFollow, deleteFollow } from "@/services/follow-services";
import type { GetServerSideProps } from 'next';
import { getUserFromRequest } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { ddb } from '@/lib/aws-config';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const USERS_TABLE = process.env.USERS_TABLE!;


type Post = {
  PK: string;
  SK: string;
  content: string;
  timestamp?: number; // or string, depending on your data
};
type Props = {
    posts: Post[];
    profileUserId: string;
    currentUserId: string;
    isSelf: boolean;
};
export default function FeedPage({ posts, isSelf }: Props) {
    const [profileID, setProfileID] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (!posts || posts.length === 0) return;
    
        const targetProfileID = posts[1]?.PK?.replace("USER#", "");
    
        if (!targetProfileID) return;
    
        setProfileID(targetProfileID);
    
        checkFollow(targetProfileID)
            .then(data => {
                setIsFollowing(data?.isFollowing);
            })
            .catch(err => {
                console.error("Error checking follow status:", err);
            });
    
    }, [posts]);
    
    const handleFollowToggle = async () => {
    try {
        if (isFollowing) {
        await deleteFollow(profileID);
        setIsFollowing(false);
        } else {
        await createFollow(profileID);
        setIsFollowing(true);
        }
    } catch (error) {
        console.error("Error updating follow state:", error);
    }
    };
    


    return (
        <div className="max-w-xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">{isSelf ? "My Profile": "Profile"}</h1>
            {!isSelf && (
                <Button onClick={handleFollowToggle}>
                    {isFollowing ? "Unfollow" : "Follow"}
                </Button>
            )}
            <div className="flex flex-col gap-6">
                {posts.map((post) => (
                <Card key={post.SK}>
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar>
                        {/* You may not have an avatarUrl in your real data, so use a fallback */}
                        <AvatarFallback>{post.PK[5] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base font-semibold">
                        {post.PK.replace("USER#", "")}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">
                        {post.timestamp ? new Date(post.timestamp).toLocaleString() : ""}
                        </span>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <p className="text-sm">{post.content}</p>
                    </CardContent>
                </Card>
                ))}
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const req = context.req;
    const user = getUserFromRequest(req);

    if (!user) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }
    
    const profileUserId = context.params?.userID as string;
    const currentUserId = user.userId
    
    const isSelf = currentUserId === profileUserId;
    try {
	  
	  // Query DynamoDB for posts
	  	const command = new QueryCommand({
			TableName: USERS_TABLE,
			KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
			ExpressionAttributeValues: {
		  		':pk': { S: `USER#${profileUserId}` },
		  		':sk': { S: 'POST#' },
			},
	  	});
  
	  	const result = await ddb.send(command);
	  	const posts = result.Items?.map((item) => unmarshall(item)) || [];
  
	  	return {
			props: {
		  	posts,
            profileUserId,
            currentUserId,
            isSelf,
			},
	  	};
	} catch (err) {
		console.error('Error in getServerSideProps:', err);
		return {
			props: {
			posts: [],
			},
		};
	}
};

