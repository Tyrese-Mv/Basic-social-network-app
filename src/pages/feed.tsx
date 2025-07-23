import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreatePostComponent } from "@/components/CreatePost";
import type { GetServerSideProps } from 'next';
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { ddb } from '@/lib/aws-config';
import { unmarshall } from '@aws-sdk/util-dynamodb';
// import jwt from 'jsonwebtoken';
import cookie from 'cookie';
const USERS_TABLE = process.env.USERS_TABLE!;
// const JWT_SECRET = process.env.JWT_SECRET!;


type Post = {
  PK: string;
  SK: string;
  content: string;
  timestamp?: number; // or string, depending on your data
};
type Props = {
	posts: Post[];
  };
export default function FeedPage({ posts }: Props) {
	console.log(posts)

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Feed</h1>
      <CreatePostComponent></CreatePostComponent>
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
					<a href={`profile/${post.PK.replace("USER#", "")}`}>
                  {post.PK.replace("USER#", "")}
                </a>
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
	try {
	  // Parse cookies and decode token
		const cookies = cookie.parse(context.req.headers.cookie || '');
		const token = cookies.token;
  
		if (!token) {
			return {
				redirect: {
				destination: '/login',
				permanent: false,
		  		},
			};
	  	}
  
	  	const params = {
			TableName: USERS_TABLE,
			FilterExpression: "itemType = :post",
			ExpressionAttributeValues: {
			  ":post": { S: "POST" },
			},
		};
		
		const command = new ScanCommand(params);
		const result = await ddb.send(command);
		
		return {
			props: {
				posts: result.Items ? result.Items.map(item => unmarshall(item)) : [],
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
}



