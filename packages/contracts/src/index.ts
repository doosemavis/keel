export type {
  ComponentContract,
  ContractProp,
  ContractBoolean,
  ContractSlot,
  ContractState,
  ContractA11y,
  ContractStatus,
} from './types.js';
export { matrix, propMatrix, validateContract } from './types.js';

import type { ComponentContract } from './types.js';

import { buttonContract } from './button.contract.js';
import { textFieldContract } from './textfield.contract.js';
import { checkboxContract } from './checkbox.contract.js';
import { switchContract } from './switch.contract.js';
import { radioGroupContract } from './radio-group.contract.js';
import { selectContract } from './select.contract.js';
import { badgeContract } from './badge.contract.js';
import { alertContract } from './alert.contract.js';
import { cardContract } from './card.contract.js';
import { spinnerContract } from './spinner.contract.js';
import { avatarContract } from './avatar.contract.js';
import { themeToggleContract } from './theme-toggle.contract.js';

export {
  buttonContract,
  textFieldContract,
  checkboxContract,
  switchContract,
  radioGroupContract,
  selectContract,
  badgeContract,
  alertContract,
  cardContract,
  spinnerContract,
  avatarContract,
  themeToggleContract,
};

/**
 * Every contract Keel publishes, in build order.
 *
 * Docs generation, the workbench and CI validation all iterate this array —
 * adding a component here is the single step that makes it appear everywhere.
 */
export const contracts: readonly ComponentContract[] = [
  buttonContract,
  textFieldContract,
  selectContract,
  checkboxContract,
  radioGroupContract,
  switchContract,
  alertContract,
  badgeContract,
  cardContract,
  avatarContract,
  spinnerContract,
  themeToggleContract,
];

/** Look up a contract by its kebab-case id. */
export function contractById(id: string): ComponentContract | undefined {
  return contracts.find((c) => c.id === id);
}
