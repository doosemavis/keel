/**
 * Spec-driven behaviours that every Keel component must satisfy.
 *
 * ── Why these are generic and `button.behaviors.ts` is not
 *
 * The first behaviour suite was written by hand for one component, and the
 * obvious way to reach twelve was to write eleven more like it. That would have
 * produced eleven near-identical files whose only real content was a different
 * role string — and eleven places for the same assertion to drift.
 *
 * Everything in THIS file is derived from the spec rather than written per
 * component: the role to expect, whether the component is disableable and by
 * which strategy, which prop values must reach the DOM, whether it needs an
 * accessible name. A component is covered by adding it to the spec list, not by
 * writing a file. Behaviour that is genuinely particular to one component —
 * arrow-key roving in a radio group, a listbox opening on ArrowDown — belongs
 * in that component's own file, where the reader expects to find it.
 *
 * ── The framework rule, unchanged
 *
 * These assert on the RENDERED DOM. No hooks, no signals, no framework
 * internals. The same function bodies are imported by `@keel/react`'s tests
 * today and by `@keel/angular`'s in Phase 3, which is the only reason the parity
 * claim in the README is a mechanism rather than an intention.
 *
 * This package is private and never published — it is test infrastructure.
 */
import type { ComponentSpec } from '@keel/specs';

/** The minimal assertion surface these behaviours need from a test runner. */
export interface Assertion {
  (actual: unknown): {
    toBe(expected: unknown): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
  };
}

export interface SharedContext {
  /** The component's root element, as the consumer would find it. */
  element: HTMLElement;
  /** The whole rendered subtree, for components whose semantics sit on a child. */
  container: HTMLElement;
}

/**
 * Roles that a native element carries implicitly, so an explicit `role`
 * attribute would be redundant and — for `textbox` on an `<input>` — actively
 * discouraged by ARIA's first rule.
 */
const IMPLICIT_ROLES: Record<string, readonly string[]> = {
  button: ['button'],
  textbox: ['input', 'textarea'],
  combobox: ['select'],
  checkbox: ['input'],
  progressbar: ['progress'],
  img: ['img'],
};

/**
 * An element the user can never reach is not the component's role host.
 *
 * React Aria's Select renders a real `<select>` inside an `aria-hidden`,
 * visually-hidden container, purely so mobile browsers offer their native
 * picker. The first version of this file matched that hidden `<select>` as the
 * combobox and then reported — correctly, but uselessly — that it had no
 * accessible name. The visible trigger, which is what anyone actually
 * interacts with, was never examined.
 */
function isReachable(el: HTMLElement): boolean {
  return !el.closest('[aria-hidden="true"], [data-testid="hidden-select-container"]');
}

/** Find the element actually carrying the spec's role, native or explicit. */
export function roleHost(ctx: SharedContext, spec: ComponentSpec): HTMLElement | null {
  const role = spec.a11y.role;
  if (!role) return ctx.element;

  const explicit = [...ctx.container.querySelectorAll<HTMLElement>(`[role="${role}"]`)].find(
    isReachable,
  );
  if (explicit) return explicit;

  // An element whose ARIA role is implied by its tag also counts — demanding an
  // explicit `role` would push implementations toward `<div role="button">`,
  // which is worse than the thing being checked.
  for (const tag of IMPLICIT_ROLES[role] ?? []) {
    for (const native of ctx.container.querySelectorAll<HTMLElement>(tag)) {
      if (!isReachable(native)) continue;
      // `checkbox` and `switch` both render <input>, so the type must agree too.
      if (role === 'checkbox' && native.getAttribute('type') !== 'checkbox') continue;
      return native;
    }
  }
  return null;
}

/**
 * The component must expose the role its spec declares.
 *
 * Satisfied either by an explicit `role` or by a native element that carries it
 * implicitly — demanding the attribute outright would push implementations
 * toward `<div role="button">`, which is worse than the thing being checked.
 */
export function assertsDeclaredRole(ctx: SharedContext, expect: Assertion, spec: ComponentSpec): void {
  if (!spec.a11y.role) return;
  expect(roleHost(ctx, spec) !== null).toBe(true);
}

/**
 * Every enumerated prop value must reach the DOM as a data attribute.
 *
 * This is what makes the CSS in `@keel/react` and `@keel/angular` interchangeable:
 * both stylesheets select on `[data-variant]`, so if one framework stops
 * emitting it the shared stylesheet silently stops applying and the visual diff
 * between the two implementations becomes real. Generated from the spec, so a
 * prop added on one side and not the other fails here without anyone
 * remembering to extend a list.
 */
export function assertsSpecAttributes(
  ctx: SharedContext,
  expect: Assertion,
  spec: ComponentSpec,
  applied: Readonly<Record<string, string>>,
): void {
  for (const [prop, value] of Object.entries(applied)) {
    const declared = spec.props?.[prop];
    if (!declared) continue;

    // A prop that maps onto a real HTML attribute must NOT be duplicated as a
    // data attribute. TextField's `type` becomes `<input type="text">`; a
    // `data-type` beside it would be a second source of truth for the same
    // fact, and the one the browser ignores.
    if (declared.attribute === 'native') continue;

    // `attribute` also lets a component say it deliberately renamed the data
    // attribute. ThemeToggle emits `data-theme-value`, not `data-theme`,
    // because `data-theme` is the page-level theme stamp and a component
    // silently claiming that attribute on itself would be a real collision.
    const attr =
      declared.attribute ?? `data-${prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
    const carrier = ctx.container.querySelector<HTMLElement>(`[${attr}]`) ?? ctx.element;
    expect(carrier.getAttribute(attr)).toBe(value);
  }
}

/**
 * A disabled control must stay in the tab order and say why it is unavailable.
 *
 * The regression this exists to catch is someone "simplifying" an
 * implementation to the native `disabled` attribute. The control then silently
 * leaves the tab order, so a screen reader user cannot find it at all, and the
 * accessible description explaining why it is unavailable is suppressed along
 * with it. WCAG 1.4.3 exempts disabled controls from contrast; nothing exempts
 * them from being discoverable.
 *
 * Applies only to specs that declare `disabledStrategy: 'aria-disabled'`.
 */
export function assertsDisabledStrategy(
  ctx: SharedContext,
  expect: Assertion,
  spec: ComponentSpec,
): void {
  if (spec.a11y.disabledStrategy !== 'aria-disabled') return;
  const host = roleHost(ctx, spec) ?? ctx.element;

  expect(host.getAttribute('aria-disabled')).toBe('true');
  expect(host.hasAttribute('disabled')).toBe(false);
  // tabindex="-1" removes it from sequential navigation just as surely.
  expect(host.getAttribute('tabindex') !== '-1').toBe(true);
}

/**
 * A component with a required `label`-ish slot must produce an accessible name.
 *
 * Checked through the three mechanisms that actually give an element its name —
 * `aria-label`, `aria-labelledby` pointing at real text, or an associated
 * `<label>` — rather than by looking for visible text, which a control can have
 * plenty of without any of it being its name.
 */
export function assertsAccessibleName(
  ctx: SharedContext,
  expect: Assertion,
  spec: ComponentSpec,
  expected: string,
): void {
  const host = roleHost(ctx, spec) ?? ctx.element;

  const ariaLabel = host.getAttribute('aria-label');
  if (ariaLabel) {
    expect(ariaLabel.includes(expected)).toBe(true);
    return;
  }

  const labelledBy = host.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => ctx.container.ownerDocument.getElementById(id)?.textContent ?? '')
      .join(' ');
    expect(text.includes(expected)).toBe(true);
    return;
  }

  const id = host.getAttribute('id');
  const label = id ? ctx.container.querySelector<HTMLElement>(`label[for="${id}"]`) : null;
  const wrapping = host.closest('label');
  const text = label?.textContent ?? wrapping?.textContent ?? '';
  expect(text.includes(expected)).toBe(true);
}

/**
 * A component that reports progress or status must not lie about being busy.
 *
 * `aria-busy` is asserted rather than React Aria's `data-pending`, because the
 * Angular package cannot reproduce a React Aria artifact and the shared suite
 * has to hold both to the same signal.
 */
export function assertsBusyState(
  ctx: SharedContext,
  expect: Assertion,
  spec: ComponentSpec,
  busy: boolean,
): void {
  const host = roleHost(ctx, spec) ?? ctx.element;
  const value = host.getAttribute('aria-busy');
  expect(busy ? value === 'true' : value !== 'true').toBe(true);
}

/** Nothing in the tree may carry an ARIA attribute that points at a missing id. */
export function assertsNoDanglingAriaReferences(ctx: SharedContext, expect: Assertion): void {
  const IDREF_ATTRS = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns'];
  const doc = ctx.container.ownerDocument;

  for (const el of ctx.container.querySelectorAll<HTMLElement>('*')) {
    for (const attr of IDREF_ATTRS) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      for (const id of value.split(/\s+/).filter(Boolean)) {
        expect(doc.getElementById(id) !== null).toBe(true);
      }
    }
  }
}
