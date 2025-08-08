import { createFollow } from '@/services/follow-services';
import { useEffect, useState } from 'react';

type Profile = {
  userId: string;
  username: string;
};

export default function SuggestedProfilesCarousel({ userId }: { userId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestedProfiles() {
      try {
        const res = await fetch(`/api/suggested-profiles?userId=${userId}`);
        const data = await res.json();
        setProfiles(data);
      } catch (error) {
        console.error('Failed to fetch suggested profiles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestedProfiles();
  }, [userId]);

  const handleFollow = async (followId: string) => {
    try {
      const res = await createFollow(followId);

      if (res) { // Potential Bug
        setProfiles(prev => prev.filter(p => p.userId !== followId));
      } else {
        console.error('Follow request failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading suggestions...</p>;

  return (
    <div className="overflow-x-auto whitespace-nowrap py-4 px-2 space-x-4 flex">
      {profiles.length === 0 ? (
        <p className="text-sm text-gray-500">No suggestions available.</p>
      ) : (
        profiles.map((profile) => (
          <div
            key={profile.userId}
            className="inline-block w-48 rounded-xl bg-white shadow-md p-4 text-center space-y-2"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-300" />
            <p className="font-semibold text-sm">{profile.username}</p>
            <button
              onClick={() => handleFollow(profile.userId)}
              className="px-4 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
            >
              Follow
            </button>
          </div>
        ))
      )}
    </div>
  );
}
