import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import '@testing-library/jest-dom';
import { findJsonObject, getUserConfig } from '../src/utils';
import { getStreamingClient } from '../src/clients/factory';

vi.mock('../src/utils', async () => ({
  getUserConfig: vi.fn(),
  findJsonObject: vi.fn(),
}));

vi.mock('../src/clients/factory', async () => ({
  getStreamingClient: vi.fn(),
}));

vi.mock('./tools', () => ({
  default: {
    someFunction: {
      f: vi.fn(),
      args: {},
    },
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock getUserConfig to return a default configuration
    vi.mocked(getUserConfig).mockResolvedValue({
      platform: 'aws',
      url: 'https://example.com',
      model: 'someModel',
      temperature: 0.7,
      top_p: 1,
      max_steps: 10,
    });
    // Mock getStreamingClient to return a mock client
    vi.mocked(getStreamingClient).mockResolvedValue({
      getTextStream: vi.fn(),
    } as any);
  });

  it('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders main app after loading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

});
