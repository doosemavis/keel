export type {
  ComponentSpec,
  SpecProp,
  SpecBoolean,
  SpecSlot,
  SpecState,
  SpecA11y,
  SpecStatus,
} from './types.js';
export { matrix, propMatrix, validateSpec } from './types.js';

import type { ComponentSpec } from './types.js';

import { buttonSpec } from './button.js';
import { textFieldSpec } from './textfield.js';
import { checkboxSpec } from './checkbox.js';
import { switchSpec } from './switch.js';
import { radioGroupSpec } from './radio-group.js';
import { selectSpec } from './select.js';
import { badgeSpec } from './badge.js';
import { alertSpec } from './alert.js';
import { cardSpec } from './card.js';
import { spinnerSpec } from './spinner.js';
import { avatarSpec } from './avatar.js';
import { themeToggleSpec } from './theme-toggle.js';

export {
  buttonSpec,
  textFieldSpec,
  checkboxSpec,
  switchSpec,
  radioGroupSpec,
  selectSpec,
  badgeSpec,
  alertSpec,
  cardSpec,
  spinnerSpec,
  avatarSpec,
  themeToggleSpec,
};

/**
 * Every contract Keel publishes, in build order.
 *
 * Docs generation, the workbench and CI validation all iterate this array —
 * adding a component here is the single step that makes it appear everywhere.
 */
export const specs: readonly ComponentSpec[] = [
  buttonSpec,
  textFieldSpec,
  selectSpec,
  checkboxSpec,
  radioGroupSpec,
  switchSpec,
  alertSpec,
  badgeSpec,
  cardSpec,
  avatarSpec,
  spinnerSpec,
  themeToggleSpec,
];

/** Look up a contract by its kebab-case id. */
export function specById(id: string): ComponentSpec | undefined {
  return specs.find((c) => c.id === id);
}
