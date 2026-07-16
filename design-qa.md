# Luna onboarding design QA

- Source visual truth: user-provided onboarding screenshot in the current conversation, with the established home-page white, dark-text, and terracotta palette as the requested correction.
- Implementation: `src/components/Onboarding.tsx`
- Viewport: desktop, approximately 1479 × 781
- State: onboarding, values and interests step
- Full-view comparison: the obsolete lime progress bar, lime logo mark, pale-green button, and low-contrast fields were removed in code. The replacement uses white, `#2b211d`, and `#ad4f37` consistently.
- Focused comparison: inputs now have visible labels, defined borders and focus states; the primary action is solid terracotta; selected cards and consent states use solid terracotta instead of lime tinting.
- Primary interactions: all six steps, Back, Continue, selection states, validation disabling, save state, and API error state remain wired. Production build passed.
- Console errors: not checked because an in-app browser control surface was unavailable for a fresh authenticated capture.

## Findings

- P1 resolved in code: onboarding used the obsolete lime/dark theme instead of the home-page palette.
- P1 resolved in code: fields were visually disappearing into the white background after global theme overrides.
- P2 resolved in code: excessive empty space and weak form hierarchy made the step feel unfinished.
- P2 verification blocker: a fresh authenticated browser capture could not be produced in this session.

## Comparison history

1. Initial evidence: supplied screenshot showed lime brand accents, almost invisible inputs, weak contrast, and a pale-green action.
2. Fixes: rebuilt all six onboarding states using the home-page palette, consistent typography, visible inputs, solid selection states, compact spacing, and responsive controls.
3. Post-fix evidence: TypeScript and Vite production build passed; rendered browser comparison remains unavailable.

final result: blocked
