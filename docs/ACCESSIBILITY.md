# Accessibility

DMSI is designed for keyboard, touch, pointer, switch-control, and screen-reader use. Accessibility is a release requirement, not an optional enhancement.

## Current provisions

- Semantic landmarks, headings, lists, buttons, progress elements, and navigation
- A skip link and programmatic focus management between application views
- Button-based ranking with no drag-only interaction
- Keyboard-visible focus indicators and a logical source order
- Polite live regions for selection and result-action status
- Text labels in addition to color, shape, and position
- Responsive layouts from 320-pixel screens through large displays
- Dark and light themes with contrast-conscious design tokens
- Reduced-motion behavior through `prefers-reduced-motion`
- A simplified print stylesheet that preserves the complete result
- A usable no-script message when the interactive application cannot run

## Contribution checklist

For any interface change:

1. Complete the affected task using only the keyboard.
2. Confirm that focus is visible and moves predictably.
3. Confirm names, roles, states, and status messages with a screen reader or accessibility tree.
4. Check dark mode, light mode, 200 percent zoom, a 320-pixel viewport, and reduced motion.
5. Verify that meaning does not depend on color alone.
6. Verify the printed result when results markup or styling changes.

Automated checks catch structural regressions but do not replace manual assistive-technology testing.

## Standard and limitations

The project aims to follow WCAG 2.2 Level AA practices where applicable. This statement describes an engineering target, not a formal conformance certification. The repository does not currently publish a completed third-party audit or Accessibility Conformance Report.

Report an accessibility problem with the [bug report form](https://github.com/mralexgarrido/dmsi/issues/new?template=bug_report.yml). Include the browser, assistive technology, affected task, and observed behavior. Do not include private assessment answers.

