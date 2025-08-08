import React, { useState } from 'react';
import { sendPost } from '@/services/post-services';

export const CreatePostComponent: React.FC = () => {
  const [formData, setFormData] = useState({
    postMessage: '',
    imageAttached: null as File | null,
  });

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { postMessage, imageAttached } = formData;
    const post = postMessage.trim();

    if (!post) return;

    try {
      await sendPost(post, imageAttached?.name ?? '');
      setFormData({ postMessage: '', imageAttached: null });
    } catch (error) {
      console.error('Task creation failed:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
    if (type === 'file' && files) {
      setFormData((prev) => ({
        ...prev,
        imageAttached: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 mb-6 w-full max-w-xl mx-auto border">
      <form onSubmit={handlePostSubmit} className="flex flex-col gap-4">
        <textarea
          id="makePost"
          name="postMessage"
          value={formData.postMessage}
          onChange={handleInputChange}
          placeholder="What's on your mind?"
          rows={4}
          className="w-full resize-none p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>

        <div>
          <label className="block mb-1 text-sm text-gray-500">
            Attach an image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="text-sm"
          />
        </div>

        <button
          type="submit"
          className="self-end bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Post
        </button>
      </form>
    </div>
  );
};
