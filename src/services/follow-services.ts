
export const checkFollow = async (profileId: string) => {
    const res = await fetch(`/api/follow?ProfileID=${profileId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return data.isFollowing;
};

export const createFollow = async (profileId: string) => {
    const res = await fetch(`/api/follow?ProfileID=${profileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
};

export const deleteFollow = async (profileId: string) => {
    const res = await fetch(`/api/follow?ProfileID=${profileId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
};