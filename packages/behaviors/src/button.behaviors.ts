/**
 * Shared Button behaviours.
 *
 * These assertions run against the RENDERED DOM — they never touch a React
 * hook, an Angular signal, or any framework internal. That is the entire point:
 * the same function body is imported by `@keel/react`'s Button test today and
 * by `@keel/angular`'s Button test in Phase 3, so the two implementations are
 * held to one behavioural contract rather than two that drift apart.
 *
 * The rule for anything added here: assert on roles, ARIA attributes, focus and
 * keyboard behaviour. If an assertion cannot be written without knowing which
 * framework rendered the element, it does not belong in this file.
 *
 * This package is private and never published — it is test infrastructure.
 */
import { buttonContract } from '@keel/contracts';

export interface BehaviorContext {
  /** The rendered button element under test. */
  element: HTMLElement;
  /** Dispatches a real click / press. */
  click: (el: HTMLElement) => Promise<void> | void;
  /** Presses a key on the currently focused element. */
  keyDown: (key: string) => Promise<void> | void;
  /** Moves focus as a Tab press would. */
  tab: () => Promise<void> | void;
}

export interface Assertion {
  (actual: unknown): {
    toBe(expected: unknown): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
  };
}

/** The button must expose the role the contract declares. */
export function assertsRole(ctx: BehaviorContext, expect: Assertion): void {
  const explicit = ctx.element.getAttribute('role');
  const isNativeButton = ctx.element.tagName.toLowerCase() === 'button';
  // Either a native <button> (implicit role) or an explicit matching role.
  expect(explicit === buttonContract.a11y.role || isNativeButton).toBe(true);
}

/**
 * A disabled button must stay in the tab order.
 *
 * This is the assertion that catches the most common regression: someone
 * "simplifies" the implementation by switching to the native `disabled`
 * attribute, the control silently leaves the tab order, and screen reader users
 * stop being able to find it at all. Native `disabled` also suppresses the
 * accessible description explaining WHY the action is unavailable.
 */
export function assertsDisabledStaysFocusable(ctx: BehaviorContext, expect: Assertion): void {
  expect(ctx.element.getAttribute('aria-disabled')).toBe('true');
  expect(ctx.element.hasAttribute('disabled')).toBe(false);
  // tabindex="-1" would remove it from sequential navigation just as surely.
  expect(ctx.element.getAttribute('tabindex') !== '-1').toBe(true);
}

/** A disabled button must refuse activation by pointer and by keyboard. */
export async function assertsDisabledRefusesActivation(
  ctx: BehaviorContext,
  expect: Assertion,
  getCallCount: () => number,
): Promise<void> {
  const before = getCallCount();
  await ctx.click(ctx.element);
  expect(getCallCount()).toBe(before);

  ctx.element.focus();
  for (const key of buttonContract.a11y.activationKeys ?? []) {
    await ctx.keyDown(key);
  }
  expect(getCallCount()).toBe(before);
}

/** An enabled button must activate on every key the contract lists. */
export async function assertsActivatesOnContractKeys(
  ctx: BehaviorContext,
  expect: Assertion,
  getCallCount: () => number,
): Promise<void> {
  for (const key of buttonContract.a11y.activationKeys ?? []) {
    const before = getCallCount();
    ctx.element.focus();
    await ctx.keyDown(key);
    expect(getCallCount() > before).toBe(true);
  }
}

/** Loading must announce busy without disturbing the accessible name. */
export function assertsLoadingIsBusy(ctx: BehaviorContext, expect: Assertion, expectedName: string): void {
  expect(ctx.element.getAttribute('aria-busy')).toBe('true');
  expect(ctx.element.textContent?.includes(expectedName)).toBe(true);
}

/** Every variant and size in the contract must reach the DOM as a data attribute. */
export function assertsRendersContractAttributes(
  ctx: BehaviorContext,
  expect: Assertion,
  combo: { variant: string; size: string },
): void {
  expect(ctx.element.getAttribute('data-variant')).toBe(combo.variant);
  expect(ctx.element.getAttribute('data-size')).toBe(combo.size);
}
