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
    FollowCount: number,
    FollowerCount: number
};
export default function FeedPage({ posts, isSelf, FollowCount, FollowerCount }: Props) {
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
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">
              {isSelf ? "My Profile" : "Profile"}
            </h1>
            {!isSelf && (
              <Button
                onClick={handleFollowToggle}
                className={`transition duration-200 ${
                  isFollowing
                    ? "bg-gray-300 text-black hover:bg-gray-400"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mb-6">
                <h5> Following: {FollowCount}</h5>
                <h5> Followers: {FollowerCount}</h5>
          </div>
      
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center mt-10">
              {isSelf ? "You haven’t posted anything yet." : "No posts yet."}
            </p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card
                  key={post.SK}
                  className="rounded-2xl shadow-md transition hover:shadow-lg"
                >
                  <CardHeader className="flex flex-row items-start gap-4 pb-2">
                    <Avatar>
                      <AvatarFallback>
                        {post.PK.replace("USER#", "").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        @{post.PK.replace("USER#", "")}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {post.timestamp
                          ? new Date(post.timestamp).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
        //Following Count
        const FollowCommand = new QueryCommand({
			TableName: USERS_TABLE,
			KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
			ExpressionAttributeValues: {
		  		':pk': { S: `USER#${profileUserId}` },
		  		':sk': { S: 'FOLLOW#' },
			},Select: 'COUNT'
	  	});

        const followResult = await ddb.send(FollowCommand)

        //Follower
        const FollowerCommand = new QueryCommand({
			TableName: USERS_TABLE,
			KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
			ExpressionAttributeValues: {
		  		':pk': { S: `USER#${profileUserId}` },
		  		':sk': { S: 'FOLLOWER#' },
			},Select: 'COUNT'
	  	});

        const followerResult = await ddb.send(FollowerCommand)

        const FollowCount = followResult.Count

        const FollowerCount = followerResult.Count

	  	const posts = result.Items?.map((item) => unmarshall(item)) || [];
  
	  	return {
			props: {
		  	posts,
            profileUserId,
            currentUserId,
            isSelf,
            FollowCount,
            FollowerCount
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

