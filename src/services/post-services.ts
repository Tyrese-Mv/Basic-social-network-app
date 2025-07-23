
export const sendPost = (post : string, imageUrl: string) => {
    fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            content: post,
            imageUrl: imageUrl
        }),
      });
}