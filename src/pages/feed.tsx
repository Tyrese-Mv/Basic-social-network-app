import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreatePostComponent } from "@/components/CreatePost";
import type { GetServerSideProps } from "next";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { ddb } from "@/lib/aws-config";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import SuggestedProfilesCarousel from "@/components/SuggestedProfilesCarousel";
import { getUserFromRequest } from "@/lib/auth";
import { Post } from "@/lib/utils";

const USERS_TABLE = process.env.USERS_TABLE!;


type Props = {
  posts: Post[];
  userId: string;
};

export default function FeedPage({ posts, userId }: Props) {
	console.log(posts)
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-10 text-center">Your Feed</h1>

      <div className="mb-10">
        <CreatePostComponent />
      </div>

	  <h1 className="text-xl font-bold mb-4">Suggested Profiles</h1>
      <SuggestedProfilesCarousel userId={userId} />

      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <Card
            key={post.SK}
            className="transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
          >
            <CardHeader className="flex flex-row items-start gap-4 pb-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {post.PK[5]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <CardTitle className="text-base font-semibold leading-none mb-1">
                  <a
                    href={`/profile/${post.PK.replace("USER#", "")}`}
                    className="hover:underline"
                  >
                    @{post.username}
                  </a>
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {post.timestamp
                    ? new Date(post.timestamp).toLocaleString()
                    : ""}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-sm text-gray-800">{post.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const req = context.req;
    const user = getUserFromRequest(req);

    if (!user) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

	const userId = user.userId

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
        posts: result.Items ? result.Items.map((item) => unmarshall(item)) : [],
		userId: userId,
      },
    };
  } catch (err) {
    console.error("Error in getServerSideProps:", err);
    return {
      props: {
        posts: [],
      },
    };
  }
};
