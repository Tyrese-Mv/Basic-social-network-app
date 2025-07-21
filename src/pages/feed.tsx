import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const mockFeed = [
  {
    id: 1,
    user: {
      name: "Alice Johnson",
      avatarUrl: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    content: "Just finished a 5k run! Feeling great! 🏃‍♀️",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    user: {
      name: "Bob Smith",
      avatarUrl: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    content: "Excited to start a new project with Next.js and ShadCN UI! 🚀",
    timestamp: "3 hours ago",
  },
  {
    id: 3,
    user: {
      name: "Carol Lee",
      avatarUrl: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    content: "Anyone up for a coffee chat this weekend? ☕️",
    timestamp: "5 hours ago",
  },
];

export default function FeedPage() {
  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Feed</h1>
      <div className="flex flex-col gap-6">
        {mockFeed.map((post) => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar>
                <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                <AvatarFallback>{post.user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base font-semibold">{post.user.name}</CardTitle>
                <span className="text-xs text-muted-foreground">{post.timestamp}</span>
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
