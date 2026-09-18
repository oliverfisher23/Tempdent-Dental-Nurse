# Experience, accessibility and mobile review

Reviewed: 18 September 2026.

## Scope and boundaries

This review covers entry and resuming, the shared kitchen controls, every phase of the five tasks, written briefings, completion and restarting. It includes current learning workspaces and relevant saved/legacy paths. The aim is meaningful practical decisions, not additional “Next” buttons, scores or decorative game mechanics.

The signed task wording, scenario values, required evidence, sequential unlocking, signatures, completed-work protection and host event identifiers are unchanged. The review does not constitute employer approval of food-safety teaching or permission to serve a proposed menu.

Accessibility is assessed against relevant WCAG 2.2 AA requirements, with reduced-motion support as an additional interaction preference. This is an engineering review, not a formal conformance certification or a substitute for testing with disabled learners and assistive technologies.

## Task-by-task changes

| Activity | Substantive learner work and improvements | Mobile and keyboard approach |
| --- | --- | --- |
| Entry and briefing | Learners can open the briefing without requesting fullscreen. Task-specific device advice explains what they will do. Written briefings are clearly labelled rather than presented as a playable film. | Zoom is no longer restricted. Written briefings have one scrollable container. Native focus, labelled name entry and skip navigation are available. |
| 1. Handover and fridges | Read the overnight evidence, inspect each appliance, start and observe a settling probe, compare with the supplied limit, and write an observation. Appliance and evidence progress make the purpose of each check clearer. | Labelled appliance navigation, one-action probing, written evidence and associated field errors. No sustained press is required in the active inspection. |
| 2. Delivery | Measure goods, read the settled results, enter quantities and temperatures, compare the records, explain the fish evidence and report/amend the discrepancy. Immediate entry and decision feedback replaces uncertainty about why progress is blocked. The ten reference photographs are retained. | A phone switches between the order and a full-width inspection rather than splitting the available height. Desktop keeps comparison panes. Selection and back navigation manage focus; records keep their values. |
| 3. Chilling | Plan and revise portions, arrange trays, choose a probe position, record readings, and interpret the authored cooling comparison. Quantity, capacity, spacing and settled-reading feedback explain the consequences of actions. | Labelled selection/placement/removal/measurement controls accompany optional dragging. Mobile cards and stacked recording rows replace cramped comparisons. |
| 4. Dietary requirements | Compare one recipe with fourteen allergen categories, deliberately review the row, use that evidence in guest-specific proposals, and identify preparation/service checks that remain outstanding. This is not permission to serve. | One-dish chart panels and one-guest decisions, with source evidence beside the decision on larger screens and a readable vertical flow on phones. Controls have explicit names and selected states. |
| 5. Waste and handover | Observe the scale settle, enter the three weights, explain the issue, distinguish saved facts from supplied information and proposed actions, prioritise the handover and respond to the evening team. Answers are not automatically written for the learner. | Weight/error announcements, grouped timing and responsibility controls, readable mobile forms and focus-managed team exchanges. |
| Completion | The recap continues to use the learner’s actual saved work. Restarting now requires confirmation before deleting that completed shift. | The heading receives focus and the reset confirmation has keyboard focus management and safe cancellation. |

Navigation only opens workspaces. It does not take measurements, fill records, choose answers or sign work. Transitions are short and indicate a change of place, evidence or selection; reduced-motion preferences are respected.

## Accessibility review

| Area | Implemented response | Verification boundary |
| --- | --- | --- |
| Keyboard and touch | Native controls, labelled choices, focus outlines, keyboard/touch alternatives to manipulation, and skip navigation. | Browser checks plus a real assistive-technology pass are needed; mouse success alone is insufficient. |
| Focus and overlays | Guide-aware focus handling, named workspaces, focus return for item selection, and cancellable navigation with a timeout. Workspaces that keep the guide active are non-modal rather than falsely claiming the whole background is unavailable. | Embedded LMS behaviour must also be checked in the actual host. |
| Labels, status and errors | Associated input labels, descriptive groups, selected states, settled measurement text and visible/announced validation. | Automated checks cannot establish whether every instruction is understandable to the intended learners. |
| Colour and contrast | Headings inherit the surrounding panel colour rather than being forced black on dark panels. Destructive-button contrast and global focus indicators were strengthened. | Automated contrast checks and human review must be interpreted in the context of pictures, disabled controls and animation states. |
| Motion and timing | OS reduced-motion preference, restrained transitions and explicit measurement states. The simulated shift is not a real-time answer deadline. | Real learner testing is still needed for fatigue, cognitive load and motion sensitivity. |
| Reflow and zoom | Removed `maximum-scale=1`; responsive workspaces, phone cards and larger coarse-pointer targets. Android-compatible viewport resizing is requested when the keyboard opens. | Physical iOS/Android keyboard and screen-reader behaviour cannot be certified from desktop emulation. |
| Media | Written briefings and existing written inspection evidence remain available without sound. Unprovided films are not advertised as working video players. | Final films, meaningful audio, captions and equivalent descriptions are still release checks. No transcripts or caption files have been invented. |
| Saved work and mistakes | Existing completion gates remain in the model. Forms retain their controlled saved data; completed tasks remain frozen. Restart requires explicit confirmation. | This app stores work in the current browser, not in a cross-device account. |

## Device recommendations

- **Laptop or desktop recommended if available:** particularly delivery comparisons, tray arrangements and allergen-chart/recipe comparisons.
- **Large tablet:** useful for layouts; use labelled placement controls rather than relying on precise dragging.
- **Phone:** supported through focused workspaces, item/dish cards and explicit back/selection controls. Fridge checks and weighing suit this one-item-at-a-time format.
- **Long handover writing:** a laptop keyboard may be more comfortable; it is not mandatory.
- Choose the device before starting where possible. Saved work does **not** automatically follow the learner to another device or browser.
- Fullscreen and sound are optional. Do not instruct learners to use a mouse or laptop as a substitute for accessible controls.

The app presents this advice in the initial briefing and in task help.

## Release checks not resolved by code changes

1. Confirm the employer-approved fridge clips and assess their actual audio. The supplied archive has audio streams but no caption sidecars; the presence of an audio stream alone does not establish what captioning is needed. Selected films need appropriate captions and/or equivalent descriptions before learner release.
2. Supply and check the final filmed briefings. Their written versions remain available meanwhile.
3. Test with NVDA or another desktop screen reader, VoiceOver/TalkBack on real devices, enlarged text, mobile keyboards, and the actual LMS iframe. Include learners with differing access needs in usability testing.
4. Retain employer review of receiving guidance, cooling-case framing, dietary preparation/service checks and closing-handover prompts. A working interface is not that approval.
5. The previously sourced smoked-haddock reference photograph still needs reuse permission or replacement before publication.

## Verification record

- Existing model regressions: 13 passed. They cover fresh/seeded progress, completion gates, delivery evidence, tray spacing, dietary holds, team clarifications and legacy persistence.
- TypeScript checking and a production build passed. The running preview restarted successfully.
- A Chromium interaction pass covered in-window entry, Task 1 probing and manual recording, Task 2 measurement and value retention when switching items, Task 3 non-drag tray selection, Task 4's service hold, Task 5's pending follow-ups/team exchange, and cancelling a completed-shift reset without losing the summaries. No application console errors were observed.
- The keyboard skip link moved focus to the main landmark. A targeted Task 5 Escape check confirmed that the handover workspace closes and focus returns to its opening guide button after the exit transition. An initial report of it staying open was not reproduced; the targeted check waited 650 ms for that transition.
- axe-core 4.10.3 checked the welcome screen and the five opening workspaces at 1280 px and 390 px widths, using WCAG A/AA rule tags through WCAG 2.2. It identified contrast defects in the shared task label, speaker label and portioning controls; these were corrected. It also caught the designer-only test badge obscuring a header control; this overlay is not present in the learner view.
- Targeted post-fix scans of portioning at 1280 px, the fresh allergen chart at 320 × 568, and delivery at 640 × 450 reported no automated violations or horizontal page overflow. The designer-only overlay was hidden for these learner-view scans. The 640 px check tests reflow, not physical-device pinch zoom.
- Verification is deliberately bounded: this was not an exhaustive check of every filled/error state, every row/guest transition, or every browser. Screen-reader announcements, physical mobile keyboards, actual zoom behaviour and host embedding still need the release checks above. Automated zero findings in a snapshot do not prove full WCAG conformance.

### Supporting reviews

- [Shared shell](shell-accessibility-review.md)
- [Task 1](task-1-experience-review.md)
- [Task 2](task-2-experience-review.md)
- [Task 3](task-3-experience-review.md)
- [Task 4](task-4-experience-review.md)
- [Task 5](task-5-experience-review.md)