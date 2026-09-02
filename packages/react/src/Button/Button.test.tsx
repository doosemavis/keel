import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buttonContract, propMatrix } from '@keel/contracts';
import {
  assertsActivatesOnContractKeys,
  assertsDisabledRefusesActivation,
  assertsDisabledStaysFocusable,
  assertsLoadingIsBusy,
  assertsRendersContractAttributes,
  assertsRole,
  type BehaviorContext,
} from '@keel/behaviors/button';
import { Button } from './Button.js';

const user = userEvent.setup();

function ctxFor(element: HTMLElement): BehaviorContext {
  return {
    element,
    click: (el) => user.click(el),
    keyDown: (key) => user.keyboard(key === ' ' ? '[Space]' : `{${key}}`),
    tab: () => user.tab(),
  };
}

describe('Button — shared behaviour contract', () => {
  it('exposes the contract role', () => {
    render(<Button>Save</Button>);
    assertsRole(ctxFor(screen.getByRole('button')), expect as never);
  });

  it('activates on every key the contract lists', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);
    await assertsActivatesOnContractKeys(
      ctxFor(screen.getByRole('button')),
      expect as never,
      () => onPress.mock.calls.length,
    );
  });

  it('keeps a disabled button focusable', () => {
    render(<Button disabled>Save</Button>);
    assertsDisabledStaysFocusable(ctxFor(screen.getByRole('button')), expect as never);
  });

  it('refuses activation when disabled', async () => {
    const onPress = vi.fn();
    render(
      <Button disabled onPress={onPress}>
        Save
      </Button>,
    );
    await assertsDisabledRefusesActivation(
      ctxFor(screen.getByRole('button')),
      expect as never,
      () => onPress.mock.calls.length,
    );
  });

  it('announces busy while loading without changing the accessible name', () => {
    render(<Button loading>Save</Button>);
    assertsLoadingIsBusy(ctxFor(screen.getByRole('button')), expect as never, 'Save');
  });

  it('refuses activation while loading', async () => {
    const onPress = vi.fn();
    render(
      <Button loading onPress={onPress}>
        Save
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Button — contract matrix', () => {
  // Generated from the contract, not hand-listed. A variant added to the
  // contract without an implementation fails here automatically.
  const combos = propMatrix(buttonContract) as Array<{ variant: string; size: string }>;

  it(`covers all ${combos.length} prop combinations`, () => {
    expect(combos).toHaveLength(
      buttonContract.props.variant.values.length * buttonContract.props.size.values.length,
    );
  });

  it.each(combos.map((c) => [`${c.variant}/${c.size}`, c] as const))(
    'renders %s with contract attributes',
    (_label, combo) => {
      const { unmount } = render(
        <Button variant={combo.variant as never} size={combo.size as never}>
          Save
        </Button>,
      );
      assertsRendersContractAttributes(ctxFor(screen.getByRole('button')), expect as never, combo);
      unmount();
    },
  );
});

describe('Button — defaults match the contract', () => {
  it('uses the contract default variant and size when none is given', () => {
    render(<Button>Save</Button>);
    const el = screen.getByRole('button');
    expect(el.getAttribute('data-variant')).toBe(buttonContract.props.variant.defaultValue);
    expect(el.getAttribute('data-size')).toBe(buttonContract.props.size.defaultValue);
  });
});
