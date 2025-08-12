import React from 'react';
import '@testing-library/jest-dom';

// Mock next/image to render a regular img in tests without using JSX
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src?: string | { src?: string }; alt?: string } & Record<string, unknown>) => {
    const { src, alt, ...rest } = props;
    const resolvedSrc = typeof src === 'string' ? src : (src?.src ?? '');
    return React.createElement('img', {
      src: resolvedSrc,
      alt: alt ?? '',
      ...rest,
    });
  },
}));

// Mock next/font/google to return simple className variables
jest.mock('next/font/google', () => ({
  Geist: () => ({ className: 'geist', variable: 'geist' }),
  Geist_Mono: () => ({ className: 'geist-mono', variable: 'geist-mono' }),
}));

// Provide a default fetch mock if not present (Node 20 has fetch, but ensure tests don't fail)
const globalWithFetch = globalThis as unknown as { fetch?: unknown };
if (typeof globalWithFetch.fetch === 'undefined') {
  globalWithFetch.fetch = jest.fn();
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set up global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 