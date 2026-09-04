import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar.js';

describe('Avatar', () => {
  it('renders initials when a name is given', () => {
    render(<Avatar name="Moose Davis" />);
    expect(screen.getByText('MD')).toBeTruthy();
  });

  it('renders the blank-state glyph when no name or image is given', () => {
    const { container } = render(<Avatar unknownLabel="Unknown user" />);
    expect(container.querySelector('.keel-Swirl')).not.toBeNull();
    expect(screen.getByRole('img', { name: 'Unknown user' })).toBeTruthy();
  });

  it('falls back to the default unknown label', () => {
    render(<Avatar />);
    expect(screen.getByRole('img', { name: 'Unknown user' })).toBeTruthy();
  });
});
