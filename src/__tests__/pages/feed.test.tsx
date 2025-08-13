import React from 'react';
import { render, screen } from '@testing-library/react';
import FeedPage, { getServerSideProps } from '@/pages/feed';
import type { GetServerSidePropsContext } from 'next';
import { Post } from '@/lib/utils';

jest.mock('@/components/CreatePost', () => ({
  CreatePostComponent: () => React.createElement('div', { 'data-testid': 'create-post' }, 'CreatePost'),
}));

jest.mock('@/components/SuggestedProfilesCarousel', () => ({
  __esModule: true,
  default: ({ userId }: { userId: string }) => React.createElement('div', { 'data-testid': 'suggested', 'data-userid': userId }, 'Suggested'),
}));

jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(() => ({ userId: 'u1' })),
}));

jest.mock('@/lib/aws-config', () => ({
  ddb: { send: jest.fn(async () => ({ Items: [] })) },
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  QueryCommand: function QueryCommand(this: { [key: string]: unknown }, input: unknown) { Object.assign(this, input); },
}));

jest.mock('@aws-sdk/util-dynamodb', () => ({
  unmarshall: (item: unknown) => item,
}));

describe('Feed page', () => {
  const posts = [
    { PK: 'USER#u2', SK: 'POST#1', content: 'Hello', username: 'u2', timestamp: Date.now() },
    { PK: 'USER#u3', SK: 'POST#2', content: 'World', username: 'u3' },
  ];

  test('renders title', () => {
    render(<FeedPage posts={posts as Post[]} userId="u1" />);
    expect(screen.getByText(/Feed/i)).toBeInTheDocument();
  });

  test('renders CreatePostComponent', () => {
    render(<FeedPage posts={posts as Post[]} userId="u1" />);
    expect(screen.getByTestId('create-post')).toBeInTheDocument();
  });

  test('renders SuggestedProfilesCarousel with userId', () => {
    render(<FeedPage posts={posts as Post[]} userId="abc" />);
    const el = screen.getByTestId('suggested');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('data-userid', 'abc');
  });

  test('renders posts list', () => {
    render(<FeedPage posts={posts as Post[]} userId="u1" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  test('renders formatted timestamp when present', () => {
    render(<FeedPage posts={posts as Post[]} userId="u1" />);
    expect(screen.getByText(/\d{1,2}\/\d{1,2}\/\d{2,4}/)).toBeInTheDocument();
  });

  test('links to profile from username', () => {
    render(<FeedPage posts={posts as Post[]} userId="u1" />);
    const link = screen.getByRole('link', { name: /@u2/i });
    expect(link).toHaveAttribute('href', '/profile/u2');
  });

  test('getServerSideProps redirects when user missing', async () => {
    const { getUserFromRequest } = jest.requireMock('@/lib/auth');
    getUserFromRequest.mockReturnValueOnce(null);
    const ctx = { req: {} } as unknown as GetServerSidePropsContext;
    const res = await getServerSideProps(ctx);
    expect('redirect' in res).toBe(true);
  });

  test('getServerSideProps returns posts when user present', async () => {
    process.env.USERS_TABLE = 'Users';
    const { ddb } = jest.requireMock('@/lib/aws-config');
    // 1) following list for u1 → follows u2
    ddb.send
      .mockResolvedValueOnce({ Items: [{ SK: { S: 'FOLLOW#u2' } }] })
      // 2) posts for u2
      .mockResolvedValueOnce({ Items: [{ PK: { S: 'USER#u2' }, SK: { S: 'POST#1' }, content: { S: 'Hi' }, username: { S: 'u2' }, timestamp: { N: '1' } }] });

    const ctx = { req: {} } as unknown as GetServerSidePropsContext;
    const res = await getServerSideProps(ctx);
    // @ts-expect-error narrowing for test
    expect(res.props.posts.length).toBe(1);
  });

  test('renders gracefully with empty posts', () => {
    render(<FeedPage posts={[]} userId="u1" />);
    expect(screen.getByText(/Suggested Profiles/i)).toBeInTheDocument();
  });
}); 