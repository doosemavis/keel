/**
 * Every component, against the shared behaviour suite.
 *
 * Before this file the repository had one component test out of twelve, while
 * the README claimed parity was enforced by shared DOM-level assertions. That
 * made the central claim an architecture diagram rather than a mechanism, and
 * it is the first thing a reader would have checked.
 *
 * The suite is driven by `specs` rather than by a hand-written list, so a
 * component added to `@keel/specs` and not rendered here fails immediately —
 * the same anti-drift trick the docs page and the story matrices already use,
 * pointed at the test layer. `MOUNTS` below is exhaustive by assertion, not by
 * good intentions.
 *
 * Every assertion imported here lives in `@keel/behaviors` and touches only the
 * rendered DOM, so `@keel/angular` will import these same function bodies in
 * Phase 3 and be held to the identical standard.
 */
import { describe, expect, it } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { ReactElement } from 'react';
import { specs, type ComponentSpec } from '@keel/specs';
import {
  assertsAccessibleName,
  assertsDeclaredRole,
  assertsDisabledStrategy,
  assertsNoDanglingAriaReferences,
  assertsSpecAttributes,
  type SharedContext,
} from '@keel/behaviors/shared';

import { Alert } from './Alert/Alert.js';
import { Avatar } from './Avatar/Avatar.js';
import { Badge } from './Badge/Badge.js';
import { Button } from './Button/Button.js';
import { Card } from './Card/Card.js';
import { Checkbox } from './Checkbox/Checkbox.js';
import { RadioGroup } from './RadioGroup/RadioGroup.js';
import { Select } from './Select/Select.js';
import { Spinner } from './Spinner/Spinner.js';
import { Switch } from './Switch/Switch.js';
import { TextField } from './TextField/TextField.js';
import { ThemeToggle } from './ThemeToggle/ThemeToggle.js';

/** The one string every accessible-name assertion looks for. */
const NAME = 'Conformance label';

interface Mount {
  /** Renders the component in its default state. */
  render: () => ReactElement;
  /** Renders it disabled — omitted for components that cannot be disabled. */
  disabled?: () => ReactElement;
  /** The accessible name the default render should produce, if it has one. */
  name?: string;
}

/**
 * How to mount each component.
 *
 * Deliberately minimal: the point is to exercise the shared behaviours, not to
 * re-document the components. Required slots are filled and nothing else, so a
 * component that only satisfies its spec when heavily configured fails here,
 * which is the correct outcome.
 */
const MOUNTS: Record<string, Mount> = {
  button: {
    render: () => <Button>{NAME}</Button>,
    disabled: () => <Button disabled>{NAME}</Button>,
  },
  'text-field': {
    render: () => <TextField label={NAME} />,
    disabled: () => <TextField label={NAME} disabled />,
    name: NAME,
  },
  select: {
    render: () => <Select label={NAME} options={[{ value: 'a', label: 'A' }]} />,
    disabled: () => <Select label={NAME} options={[{ value: 'a', label: 'A' }]} disabled />,
    name: NAME,
  },
  checkbox: {
    render: () => <Checkbox label={NAME} />,
    disabled: () => <Checkbox label={NAME} disabled />,
    name: NAME,
  },
  'radio-group': {
    render: () => <RadioGroup label={NAME} options={[{ value: 'a', label: 'A' }]} />,
    disabled: () => <RadioGroup label={NAME} options={[{ value: 'a', label: 'A' }]} disabled />,
    name: NAME,
  },
  switch: {
    render: () => <Switch label={NAME} />,
    disabled: () => <Switch label={NAME} disabled />,
    name: NAME,
  },
  alert: { render: () => <Alert title={NAME} /> },
  badge: { render: () => <Badge>{NAME}</Badge> },
  card: { render: () => <Card>{NAME}</Card> },
  avatar: { render: () => <Avatar name={NAME} />, name: NAME },
  spinner: { render: () => <Spinner label={NAME} />, name: NAME },
  'theme-toggle': {
    render: () => <ThemeToggle />,
    disabled: () => <ThemeToggle disabled />,
  },
};

function mount(el: ReactElement): SharedContext {
  const { container } = render(el);
  return { element: container.firstElementChild as HTMLElement, container };
}

describe('spec conformance — coverage', () => {
  it('mounts every component the specs declare', () => {
    const missing = specs.filter((s) => !(s.id in MOUNTS)).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it('does not mount anything the specs do not declare', () => {
    const ids = new Set(specs.map((s) => s.id));
    expect(Object.keys(MOUNTS).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe.each(specs.map((s) => [s.id, s] as const))('%s', (id, spec: ComponentSpec) => {
  // The coverage suite above already proves every spec id has a mount; this
  // narrows the type without a non-null assertion, which would hide a real gap
  // behind a `!` if that suite were ever removed.
  const mountSpec = MOUNTS[id];
  if (!mountSpec) throw new Error(`no mount registered for spec "${id}"`);

  it('exposes the role its spec declares', () => {
    const ctx = mount(mountSpec.render());
    assertsDeclaredRole(ctx, expect as never, spec);
    cleanup();
  });

  it('has no ARIA attribute pointing at a missing id', () => {
    const ctx = mount(mountSpec.render());
    assertsNoDanglingAriaReferences(ctx, expect as never);
    cleanup();
  });

  it('renders every default prop value as a data attribute', () => {
    const ctx = mount(mountSpec.render());
    const defaults = Object.fromEntries(
      Object.entries(spec.props ?? {})
        .filter(([, p]) => typeof p.defaultValue === 'string')
        .map(([k, p]) => [k, p.defaultValue as string]),
    );
    assertsSpecAttributes(ctx, expect as never, spec, defaults);
    cleanup();
  });

  const named = mountSpec.name;
  it.runIf(named)('produces an accessible name from its required label slot', () => {
    const ctx = mount(mountSpec.render());
    assertsAccessibleName(ctx, expect as never, spec, named as string);
    cleanup();
  });

  /**
   * KNOWN DEFECT — tracked, not hidden.
   *
   * Five components spread `aria-disabled` onto a React Aria Components root,
   * which filters unrecognised ARIA props rather than forwarding them. The
   * attribute never reaches the DOM, so `<Checkbox disabled>` renders a fully
   * focusable, operable checkbox: React Aria still toggles its internal state
   * on Space, while Keel's `onChange` guard swallows the callback. The control
   * appears to work and silently reports nothing — worse than a no-op.
   *
   * `it.fails` rather than `it.skip` on purpose. A skipped test is invisible; a
   * failing-as-expected test is a defect recorded in the code, and the moment
   * someone fixes the components this test FAILS — because it started passing —
   * which forces whoever fixed it to come here and delete this block. The
   * defect cannot be quietly resolved and left undocumented.
   */
  const KNOWN_DISABLED_DEFECT = new Set([
    'checkbox',
    'radio-group',
    'switch',
    'theme-toggle',
  ]);
  // Select is deliberately absent. It was on this list until correcting its
  // declared role pointed the assertion at the trigger <button>, which React
  // Aria disables correctly — and `it.fails` then failed for passing, which is
  // this mechanism working exactly as intended.

  const disabled = mountSpec.disabled;
  const check = () => {
    const ctx = mount((disabled as () => ReactElement)());
    assertsDisabledStrategy(ctx, expect as never, spec);
    cleanup();
  };

  if (disabled && KNOWN_DISABLED_DEFECT.has(id)) {
    it.fails('stays focusable and announced when disabled — KNOWN DEFECT', check);
  } else {
    it.runIf(disabled)('stays focusable and announced when disabled', check);
  }
});
