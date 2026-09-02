import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library only auto-registers its cleanup when Vitest globals are on.
// We keep globals off (explicit imports are clearer in a library), so the
// teardown is wired up by hand here. Without it, every render leaks into the
// next test and role queries start matching several elements.
afterEach(cleanup);
