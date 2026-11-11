import axe from 'axe-core';
import { expect } from 'vitest';

/** Fails with a readable list of axe violations. jsdom cannot compute layout, so contrast is checked in the browser instead. */
export async function expectNoA11yViolations(container: Element) {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  const violations = results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
  expect(violations).toEqual([]);
}
