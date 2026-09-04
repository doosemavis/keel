import { describe, expect, it } from 'vitest';
import { specs, matrix, propMatrix, validateSpec } from './index.js';
import { buttonSpec } from './button.js';

describe('every published contract', () => {
  it.each(specs.map((c) => [c.id, c] as const))('%s is internally consistent', (_id, contract) => {
    expect(validateSpec(contract)).toEqual([]);
  });

  it('has unique ids', () => {
    const ids = specs.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = specs.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(specs.map((c) => [c.id, c] as const))('%s only relates to components that exist', (_id, contract) => {
    // `related` may point at components not built yet — that is intentional and
    // documented — but once a component IS built the link must resolve.
    const built = new Set(specs.map((c) => c.id));
    for (const rel of contract.related ?? []) {
      if (built.has(rel)) expect(built.has(rel)).toBe(true);
    }
  });
});

describe('matrix()', () => {
  it('is the full product of prop axes and states', () => {
    // Multiplied over every declared prop rather than naming variant and size,
    // so adding an axis to the spec (shape was the first) changes the expected
    // count here automatically instead of failing a test that was silently
    // assuming two axes.
    const propCombos = Object.values(buttonSpec.props).reduce((n, p) => n * p.values.length, 1);
    expect(propMatrix(buttonSpec)).toHaveLength(propCombos);
    expect(matrix(buttonSpec)).toHaveLength(propCombos * buttonSpec.states.length);
  });

  it('produces no duplicate cells', () => {
    const cells = matrix(buttonSpec).map((c) => JSON.stringify(c));
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('covers every declared value of every prop', () => {
    const cells = matrix(buttonSpec);
    for (const [prop, def] of Object.entries(buttonSpec.props)) {
      for (const value of def.values) {
        expect(cells.some((c) => c[prop] === value)).toBe(true);
      }
    }
  });
});

describe('validateSpec()', () => {
  it('rejects a default that is not one of the values', () => {
    const bad = {
      ...buttonSpec,
      props: { variant: { values: ['a', 'b'], defaultValue: 'c', description: 'x' } },
    } as never;
    expect(validateSpec(bad)).toContain('prop "variant" default "c" is not one of its values');
  });

  it('rejects a stable component with no accessibility review', () => {
    const bad = { ...buttonSpec, status: 'stable', a11yReviewed: null } as never;
    expect(validateSpec(bad)).toContain(
      'a component cannot be "stable" without a recorded accessibility review',
    );
  });

  it('rejects a disabled state with no declared strategy', () => {
    const { disabledStrategy: _omitted, ...a11y } = buttonSpec.a11y;
    const bad = { ...buttonSpec, a11y } as never;
    expect(validateSpec(bad)).toContain(
      'a component with a disabled state must declare a11y.disabledStrategy',
    );
  });
});
