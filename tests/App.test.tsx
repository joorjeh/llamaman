
import { render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import React from 'react';

import App from '../src/App';

describe('App', () => {
  it('renders headline', () => {
    render(<App />);

    screen.debug();

  });
});

