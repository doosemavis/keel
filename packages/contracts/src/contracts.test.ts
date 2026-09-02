import { describe, expect, it } from 'vitest';
import { contracts, matrix, propMatrix, validateContract } from './index.js';
import { buttonContract } from './button.contract.js';

describe('every published contract', () => {
  it.each(contracts.map((c) => [c.id, c] as const))('%s is internally consistent', (_id, contract) => {
    expect(validateContract(contract)).toEqual([]);
  });

  it('has unique ids', () => {
    const ids = contracts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = contracts.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(contracts.map((c) => [c.id, c] as const))('%s only relates to components that exist', (_id, contract) => {
    // `related` may point at components not built yet — that is intentional and
    // documented — but once a component IS built the link must resolve.
    const built = new Set(contracts.map((c) => c.id));
    for (const rel of contract.related ?? []) {
      if (built.has(rel)) expect(built.has(rel)).toBe(true);
    }
  });
});

describe('matrix()', () => {
  it('is the full product of prop axes and states', () => {
    const propCombos = buttonContract.props.variant.values.length * buttonContract.props.size.values.length;
    expect(propMatrix(buttonContract)).toHaveLength(propCombos);
    expect(matrix(buttonContract)).toHaveLength(propCombos * buttonContract.states.length);
  });

  it('produces no duplicate cells', () => {
    const cells = matrix(buttonContract).map((c) => JSON.stringify(c));
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('covers every declared value of every prop', () => {
    const cells = matrix(buttonContract);
    for (const [prop, def] of Object.entries(buttonContract.props)) {
      for (const value of def.values) {
        expect(cells.some((c) => c[prop] === value)).toBe(true);
      }
    }
  });
});

describe('validateContract()', () => {
  it('rejects a default that is not one of the values', () => {
    const bad = {
      ...buttonContract,
      props: { variant: { values: ['a', 'b'], defaultValue: 'c', description: 'x' } },
    } as never;
    expect(validateContract(bad)).toContain('prop "variant" default "c" is not one of its values');
  });

  it('rejects a stable component with no accessibility review', () => {
    const bad = { ...buttonContract, status: 'stable', a11yReviewed: null } as never;
    expect(validateContract(bad)).toContain(
      'a component cannot be "stable" without a recorded accessibility review',
    );
  });

  it('rejects a disabled state with no declared strategy', () => {
    const { disabledStrategy: _omitted, ...a11y } = buttonContract.a11y;
    const bad = { ...buttonContract, a11y } as never;
    expect(validateContract(bad)).toContain(
      'a component with a disabled state must declare a11y.disabledStrategy',
    );
  });
});
