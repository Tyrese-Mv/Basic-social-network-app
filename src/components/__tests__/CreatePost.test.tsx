import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePostComponent } from '../CreatePost';

// Mock the post service
jest.mock('../../services/post-services', () => ({
  sendPost: jest.fn(),
}));

import { sendPost } from '../../services/post-services';

describe('CreatePostComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    const utils = render(<CreatePostComponent />);
    const textarea = screen.getByPlaceholderText("What's on your mind?") as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /post/i });
    const fileInput = utils.container.querySelector('input[type="file"]') as HTMLInputElement;
    return { ...utils, textarea, submitButton, fileInput };
  };

  it('renders textarea, file input, and submit button', () => {
    const { textarea, submitButton, fileInput } = setup();
    expect(textarea).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
    expect(fileInput).toBeInTheDocument();
  });

  it('updates textarea value on typing', async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, 'Hello world');
    expect(textarea).toHaveValue('Hello world');
  });

  it('does not submit when textarea is empty', async () => {
    const { submitButton } = setup();
    await userEvent.click(submitButton);
    expect(sendPost).not.toHaveBeenCalled();
  });

  it('does not submit when textarea contains only whitespace', async () => {
    const { textarea, submitButton } = setup();
    await userEvent.type(textarea, '    ');
    await userEvent.click(submitButton);
    expect(sendPost).not.toHaveBeenCalled();
  });

  it('submits with text and no image', async () => {
    const { textarea, submitButton } = setup();
    (sendPost as jest.Mock).mockResolvedValue(undefined);

    await userEvent.type(textarea, 'My first post');
    await userEvent.click(submitButton);

    expect(sendPost).toHaveBeenCalledWith('My first post', '');
  });

  it('submits with text and selected image filename', async () => {
    const { textarea, submitButton, fileInput } = setup();
    (sendPost as jest.Mock).mockResolvedValue(undefined);

    const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await userEvent.type(textarea, 'Post with image');
    await userEvent.click(submitButton);

    expect(sendPost).toHaveBeenCalledWith('Post with image', 'photo.png');
  });

  it('clears textarea after successful submission', async () => {
    const { textarea, submitButton } = setup();
    (sendPost as jest.Mock).mockResolvedValue(undefined);

    await userEvent.type(textarea, 'Clear me');
    await userEvent.click(submitButton);

    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  it('keeps textarea value if sending fails', async () => {
    const { textarea, submitButton } = setup();
    (sendPost as jest.Mock).mockRejectedValue(new Error('network'));

    await userEvent.type(textarea, 'Should remain');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('Should remain');
    });
  });

  it('trims whitespace before sending', async () => {
    const { textarea, submitButton } = setup();
    (sendPost as jest.Mock).mockResolvedValue(undefined);

    await userEvent.type(textarea, '   hello  ');
    await userEvent.click(submitButton);

    expect(sendPost).toHaveBeenCalledWith('hello', '');
  });

  it('resets selected image after successful submission (subsequent submit uses empty image)', async () => {
    const { textarea, submitButton, fileInput } = setup();
    (sendPost as jest.Mock).mockResolvedValue(undefined);

    const file = new File(['dummy'], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await userEvent.type(textarea, 'First');
    await userEvent.click(submitButton);
    expect(sendPost).toHaveBeenLastCalledWith('First', 'avatar.jpg');

    await userEvent.type(textarea, 'Second');
    await userEvent.click(submitButton);
    expect(sendPost).toHaveBeenLastCalledWith('Second', '');
  });
}); 