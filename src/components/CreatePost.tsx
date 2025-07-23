import React, { useState } from 'react';
import { sendPost } from '@/services/post-services';

export const CreatePostComponent: React.FC = () =>{

    const [formData, setFormData] = useState({
        postMessage: '',
        imageAttached: null as File | null
    });

    const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) =>{
        e.preventDefault();

        const { postMessage, imageAttached } = formData;
        const image = imageAttached;
        const post = postMessage.trim();

        if (!post){
            return
        }

        try{
            await sendPost(post, image?.name ?? "");
            setFormData({
                postMessage: '',
                imageAttached: null
            })

        }
        catch (error) {
            console.error('Task creation failed:', error);
        }

    }
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, files } = e.target as HTMLInputElement;
        if (type === "file" && files) {
            setFormData(prev => ({
                ...prev,
                imageAttached: files[0] 
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    return (
        <>
        <form onSubmit={handlePostSubmit}>
            <label htmlFor="makePost">What&apos;s on your mind?</label>
            <textarea 
            id="makePost" 
            name="postMessage"
            value={formData.postMessage}
            onChange={handleInputChange}>

            </textarea>
            <input type="file" onChange={handleInputChange} />
            <button type='submit'>Make Post</button>
        </form>
        </>
        
    )
}