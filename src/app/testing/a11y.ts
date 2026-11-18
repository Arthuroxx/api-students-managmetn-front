import axe from 'axe-core';

/**
 * Rules that need a real rendering engine (layout, canvas, or viewport metrics)
 * and cannot be evaluated reliably under jsdom. WCAG coverage for these areas is
 * verified manually through the responsive and contrast review documented in the
 * README rather than through axe.
 */
const JSDOM_UNSUPPORTED_RULES: readonly string[] = [
  'color-contrast',
  'link-in-text-block',
  'scrollable-region-focusable',
  'target-size',
];

/** WCAG 2.2 Level A and AA success criteria, the target level for this project. */
const WCAG_22_AA_TAGS: readonly string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Runs axe-core against a rendered element and returns the WCAG 2.2 AA violations.
 * Use it in component specs after `fixture.whenStable()` so the DOM under test is
 * fully rendered.
 */
export async function findA11yViolations(context: HTMLElement): Promise<axe.Result[]> {
  const results = await axe.run(context, {
    runOnly: { type: 'tag', values: [...WCAG_22_AA_TAGS] },
    rules: Object.fromEntries(JSDOM_UNSUPPORTED_RULES.map((rule) => [rule, { enabled: false }])),
  });

  return results.violations;
}

/** Formats violations into a readable message for assertion output. */
export function formatViolations(violations: readonly axe.Result[]): string {
  return violations
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
    .join('\n');
}

/** Asserts that a rendered element has no WCAG 2.2 AA violations. */
export async function expectNoA11yViolations(context: HTMLElement): Promise<void> {
  const violations = await findA11yViolations(context);

  expect(violations, formatViolations(violations)).toHaveLength(0);
}
