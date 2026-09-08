/**
 * A component contract is the single machine-readable description of what a
 * component is, shared by every framework implementation.
 *
 * It exists because of a failure mode the whole industry has: IBM, Adobe,
 * Microsoft, GitHub and Shopify all shipped a design system in two frameworks,
 * and in every case the implementation their own products didn't use drifted
 * into "community-maintained", "maintenance mode", or the archive. Drift is not
 * a discipline problem — it's a tooling problem. Nothing mechanical was
 * comparing the two.
 *
 * So the contract is the mechanism:
 *   - both frameworks generate their story matrix FROM it, so coverage is
 *     identical by construction and a variant added on one side and not the
 *     other fails the build;
 *   - the behavioural assertions are written once against the rendered DOM and
 *     imported by both frameworks' stories;
 *   - both consume the same compiled CSS, so a visual diff between them is a
 *     real bug rather than a rendering artifact.
 */

/** A single dimension of variation, e.g. `variant` or `size`. */
export interface SpecProp<T extends string = string> {
  /** Allowed values, in the order they should appear in docs and story matrices. */
  readonly values: readonly T[];
  /** The value used when the consumer passes nothing. Must be one of `values`. */
  readonly defaultValue: T;
  /**
   * How this prop reaches the DOM, when it is not the default
   * `data-<kebab-prop>`.
   *
   * `'native'` means the prop maps onto a real HTML attribute of the same name
   * and must NOT be mirrored as a data attribute — `<input type="text">` needs
   * no `data-type` beside it, and having both creates two sources of truth for
   * one fact, only one of which the browser reads.
   *
   * A literal string names a deliberate rename. It exists so that a rename is
   * a recorded decision rather than a discrepancy someone finds later: the
   * shared parity suite reads this field, so an implementation and its spec
   * cannot disagree about where a value lands.
   */
  readonly attribute?: 'native' | (string & {});
  /** One line, used verbatim as the prop description in generated docs. */
  readonly description: string;
}

/**
 * A boolean prop — `disabled`, `required`, `invalid`.
 *
 * Kept separate from `props` because booleans do not belong in the story
 * matrix. Crossing every boolean into the cartesian product doubles the cell
 * count per flag and produces mostly meaningless combinations; the interesting
 * ones are already covered by `states`.
 */
export interface SpecBoolean {
  readonly defaultValue: boolean;
  readonly description: string;
}

/**
 * A content slot — the label, the help text, the children.
 *
 * These are what a person types rather than selects, so the workbench renders
 * them as text fields. `defaultValue` doubles as the example content in docs,
 * which is why it should read like something a real product would say.
 */
export interface SpecSlot {
  readonly defaultValue: string;
  readonly description: string;
  /** Render a textarea rather than a single-line input. */
  readonly multiline?: boolean;
  /** This slot is the component's accessible name and must not be left empty. */
  readonly isAccessibleName?: boolean;
  /**
   * The consumer must supply this — the component has no fallback.
   *
   * Docs generation uses it to decide whether a slot belongs in a minimal code
   * example: a required slot always appears, an optional one only when it
   * differs from its documented default.
   */
  readonly required?: boolean;
}

/**
 * Interaction states a component can be in.
 *
 * `default` is always present. The rest are opt-in because not every component
 * has them — a Badge has no hover, and asserting one would be noise.
 */
export type SpecState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'loading' | 'invalid';

/** Accessibility obligations, asserted against the rendered DOM in both frameworks. */
export interface SpecA11y {
  /**
   * The implicit or explicit ARIA role the root element must expose, or `null`
   * for a component that deliberately has none.
   *
   * `null` is a real answer and not an omission. A Badge is static text: giving
   * it `role="status"` would make every badge on the page a live region, so a
   * screen reader announces a table of forty of them on load. A non-interactive
   * Card is a plain container: `role="group"` announces "group" around every
   * card in a list, which is noise. Both of those roles were declared here and
   * contradicted by these specs' own `notes` — the implementations were right
   * and the field was wrong, which the shared parity suite caught.
   */
  readonly role: string | null;
  /** Keys that must activate the component, as `KeyboardEvent.key` values. */
  readonly activationKeys?: readonly string[];
  /**
   * How disablement is communicated. `aria-disabled` keeps the element
   * focusable so screen reader users can still discover it; the native
   * attribute removes it from the tab order entirely.
   */
  readonly disabledStrategy?: 'aria-disabled' | 'native-disabled';
  /** The component must be reachable and operable by keyboard alone. */
  readonly keyboardOperable: boolean;
  /** Free-form notes rendered into the accessibility section of the docs page. */
  readonly notes?: readonly string[];
}

/** Component lifecycle stage. Exactly three, deliberately. */
export type SpecStatus = 'experimental' | 'stable' | 'deprecated';

export interface ComponentSpec {
  /** kebab-case, unique across the system. Also the docs URL segment. */
  readonly id: string;
  /** PascalCase export name, identical in every framework. */
  readonly name: string;
  readonly status: SpecStatus;
  /**
   * ISO date of the last manual accessibility review, or null if never
   * reviewed. Required rather than optional so that "nobody has looked at
   * this yet" is a stated fact rather than a missing field.
   */
  readonly a11yReviewed: string | null;
  readonly description: string;
  /** Variation axes. Keys become prop names in every framework. */
  readonly props: Readonly<Record<string, SpecProp>>;
  /** Boolean props. Excluded from the story matrix — see SpecBoolean. */
  readonly booleans?: Readonly<Record<string, SpecBoolean>>;
  /** Content slots the consumer supplies. */
  readonly slots?: Readonly<Record<string, SpecSlot>>;
  readonly states: readonly SpecState[];
  readonly a11y: SpecA11y;
  /** ids of components a reader should consider instead. */
  readonly related?: readonly string[];
  /** Guidance surfaced on the docs page. */
  readonly usage?: {
    readonly use?: readonly string[];
    readonly avoid?: readonly string[];
  };
}

/**
 * The cartesian product of every prop axis crossed with every state.
 *
 * This is what both frameworks build their story matrix from. Because it is
 * derived rather than written, the React and Angular matrices cannot diverge.
 */
export function matrix(contract: ComponentSpec): Array<Record<string, string>> {
  const axes = Object.entries(contract.props);
  let combos: Array<Record<string, string>> = [{}];

  for (const [prop, def] of axes) {
    combos = combos.flatMap((base) => def.values.map((value) => ({ ...base, [prop]: value })));
  }

  return combos.flatMap((combo) => contract.states.map((state) => ({ ...combo, state })));
}

/** Just the prop combinations, without the state axis. */
export function propMatrix(contract: ComponentSpec): Array<Record<string, string>> {
  const axes = Object.entries(contract.props);
  let combos: Array<Record<string, string>> = [{}];
  for (const [prop, def] of axes) {
    combos = combos.flatMap((base) => def.values.map((value) => ({ ...base, [prop]: value })));
  }
  return combos;
}

/**
 * Validate a contract's internal consistency.
 *
 * Run in CI. Catches the mistakes that would otherwise surface as a confusing
 * story matrix or a docs page that disagrees with the code.
 */
export function validateSpec(contract: ComponentSpec): string[] {
  const errors: string[] = [];

  if (!/^[a-z][a-z0-9-]*$/.test(contract.id)) {
    errors.push(`id "${contract.id}" must be kebab-case`);
  }
  if (!/^[A-Z][A-Za-z0-9]*$/.test(contract.name)) {
    errors.push(`name "${contract.name}" must be PascalCase`);
  }
  if (contract.a11yReviewed !== null && !/^\d{4}-\d{2}-\d{2}$/.test(contract.a11yReviewed)) {
    errors.push(`a11yReviewed "${contract.a11yReviewed}" must be an ISO date (YYYY-MM-DD) or null`);
  }
  if (contract.status === 'stable' && contract.a11yReviewed === null) {
    errors.push('a component cannot be "stable" without a recorded accessibility review');
  }
  if (!contract.states.includes('default')) {
    errors.push('states must include "default"');
  }

  for (const [prop, def] of Object.entries(contract.props)) {
    if (def.values.length === 0) {
      errors.push(`prop "${prop}" has no values`);
    }
    if (!def.values.includes(def.defaultValue)) {
      errors.push(`prop "${prop}" default "${def.defaultValue}" is not one of its values`);
    }
    if (new Set(def.values).size !== def.values.length) {
      errors.push(`prop "${prop}" has duplicate values`);
    }
    if (!def.description.trim()) {
      errors.push(`prop "${prop}" is missing a description`);
    }
  }

  if (contract.states.includes('disabled') && !contract.a11y.disabledStrategy) {
    errors.push('a component with a disabled state must declare a11y.disabledStrategy');
  }

  for (const [name, def] of Object.entries(contract.booleans ?? {})) {
    if (!def.description.trim()) {
      errors.push(`boolean "${name}" is missing a description`);
    }
    // A boolean that is on by default is nearly always a naming mistake:
    // `disabled = true` means every consumer has to opt out of it.
    if (def.defaultValue === true && !/^(is|has|show|allow)/.test(name)) {
      errors.push(`boolean "${name}" defaults to true — invert the name so the default is false`);
    }
  }

  for (const [name, def] of Object.entries(contract.slots ?? {})) {
    if (!def.description.trim()) {
      errors.push(`slot "${name}" is missing a description`);
    }
    if (def.isAccessibleName && !def.defaultValue.trim()) {
      errors.push(`slot "${name}" is the accessible name and cannot default to empty`);
    }
  }

  const named =
    Object.values(contract.slots ?? {}).some((s) => s.isAccessibleName) ||
    contract.a11y.notes?.some((n) => /aria-label/i.test(n));
  if (contract.a11y.keyboardOperable && !named) {
    errors.push(
      'an interactive component must declare where its accessible name comes from — mark a slot isAccessibleName, or document the labelling requirement in a11y.notes',
    );
  }

  return errors;
}
