# UX navigation review — orientation, wayfinding and flow

Reviewed: 18 September 2026, against the running development build.

## Scope and method

This review asks one question of every screen: does the learner know **where they are, what they can do here, and what to do next**? It covers the landing and briefing, the shared task shell (header, step guide, stage, dialogue, job card, map, notebook), the opening phase of each of the five tasks, transitions between tasks, resuming, and the close of day.

Evidence came from two sources:

- **Code inspection** of the routing, shell, guide, progress store and every task page.
- **Headless Chromium captures** at 1280 × 800 (desktop) and 390 × 844 (phone) of `/`, the briefing (new and returning learner), Task 1–5 at their first step and first open workspace, the job card, map, walk transition, notebook, a signed-off task, `/close` and the reset dialog, all seeded with the learning-designer fixtures. No learner took part.

Each finding is labelled **Observed** (seen in the running app or unambiguous in code) or **Assumption** (plausible, needs user testing). Signed-off task wording, scenario values, completion gates and the frozen fridge media are out of scope and unchanged.

## What already works

These should be kept as the foundation of any change:

- **One live next action.** The step guide under the header always shows a step title, one instruction and one button. The action only opens the right workspace; it never fills in evidence. Observed.
- **The map explains itself.** Destinations the learner does not need yet say “nothing to do here yet”, the needed place carries a tooltip (“The driver is waiting with three trolleys…”), the learner’s initials mark “you are here”, and the walk is a short, purposeful animation. Observed.
- **Finished work is protected and explained.** A signed-off task shows “You’ve signed this off… nothing here can be changed now” with a single “Back to where you were” route. Observed.
- **Motion respects preferences.** A global `MotionConfig reducedMotion="user"`, a CSS kill-switch for `prefers-reduced-motion`, immediate dialogue text and static scene changes under reduced motion. Observed.
- **Overlays behave.** Job card, map, notebook and close-ups trap focus, close on Escape, return focus, and the pending “Opening…” toast can be cancelled. Observed.
- **Locked deep links are handled.** Visiting a later task URL with no progress lands on `/`; with progress it lands on the current task. Observed.

## Main usability issues

Ordered by impact. Each entry gives the example, the evidence and why it matters.

### A. Orientation across the day

**1. There is no view of the whole day.** *Observed.* The shell shows “Task 2 of 5” as text and nothing else about the other four tasks: no names, no times, no ticks. The briefing promises “five tasks” without naming them; the job card describes only the current task; the map shows rooms, not tasks. A learner who wants to know “what is left?” or “what did I already do?” has nowhere to look. Impact: medium. Most acute for learners returning after a break and for anyone asked to report progress to a teacher.

**2. Three progress vocabularies compete.** *Observed.* “Task 2 of 5” (header), “STEP 1 OF 13” (guide), “0 OF 7 DONE” (fridge round), a red “0” badge on the job card, and a checklist inside the job card. Step totals are 3, 13, 6, 3 and 6 across the five tasks, so “Step 1 of 13” in Task 2 (one step per delivery item) tells the learner something very different from “Step 1 of 3” in Task 4. Impact: medium — the numbers are truthful but do not add up to a sense of how far through the shift they are.

**3. The job card badge shows “0”.** *Observed* in every fresh-task capture. A red circular badge with a zero reads as an unread-notification count, not as “0 of 5 criteria met”. Impact: low, but it is the first thing in the header that draws the eye.

### B. Knowing what to do next inside a task

**4. The room and the guide sometimes point in different directions.** *Observed.*
- Task 2 opens at the pass. The only interactive element in the picture is a pulsing red “Pick up the radio” hotspot, while the guide says “Open Salmon fillet, skin on”. Picking up the radio does nothing except reveal a second hotspot, “Go to the back door”; the radio plays no part in the later report, which opens from the guide and the order sheet regardless (`delivery/pass.tsx`). So the route the picture offers is a two-tap prop pickup that does not match the instruction, and the trolleys themselves are out of sight at the back door, reachable directly only through the guide button or the map.
- Task 1 shows two calls to action for the same step: the guide’s red “Check Walk-in fridge” and the scene’s “Open the fridge” (white on desktop, black on phone). Both open the same door, so the learner has to work out that they are duplicates rather than two different things to do.
Impact: medium–high for first-time users; it undermines the otherwise strong “one next action” rule.

**5. Clipped workspaces give no sign that there is more below.** *Observed.* The overnight log on Task 1 is cut mid-list with the “Let’s check the fridges” button off-screen (log scroller 519 px tall for 1030 px of content on the phone; 575/834 on desktop). The Task 3 bench hides the trays and “Add beef” below the fold on a phone (471/1106). The allergen chart (489/935) and the waste record scroll inside their dialogs. None of these scrollers has a fade, shadow or chevron; the only rescue is that the Task 1 guide button scrolls the log to its end. Impact: medium on phones, where the visible slice is smallest.

**6. The guide button says “Opening workspace…” whenever the map is open.** *Observed* in the captures with the map open and confirmed in code (`busy = mapOpen || !!pendingAction`). Nothing is opening; the learner simply has the map up. Impact: low, but it is a false status message in the one place that is supposed to be reliable.

**7. Task 4 opens on a black stage.** *Observed; cause confirmed in code.* Task 4’s route starts at the pass (`TASK_ROUTES['check-the-dietary-list'].start = 'pass'`) but the page registers a scene only for the events kitchen, so the learner’s first view of the task is an empty black stage with the header, guide and Yvie’s chip and nothing else, until “Open the chart” walks them to the events kitchen. The “black stage for several seconds” seen in the first captures was this, not slowness. A `dietary/pass.tsx` scene exists but is not wired in and belongs to the older function-sheet flow, so the fix is a content decision: start the task in the events kitchen, or give the pass a simple backdrop with a “Go to the events kitchen” hotspot. Separately, an action that is not picked up within five seconds of arrival is dropped silently and the button has to be pressed again (`kitchen-context.tsx`). Impact: medium–high — it is the first impression of the task.

**8. Room hotspots depend on hover to be named.** *Observed.* In the Task 4 events kitchen the workspaces are small white dots on a dark photograph, named only by a hover tooltip; touch has no hover, so a learner exploring the room has to tap to find out. The guide bypasses this, so the impact is low–medium and depends on how many learners explore rather than follow the guide (*assumption*).

### C. Entering, leaving and coming back

**9. Returning learners are treated like new visitors.** *Observed.* With a saved shift in the browser, opening or reloading `/` shows the same marketing copy and the same “Expand experience / Continue in this window” buttons as a first visit. “Continue simulation — Continue from 10:45: Chill the batch for tonight” only appears on the briefing screen, and on a phone that block is below the fold (page 1396 px tall; button off-screen in the capture). So after a tab is closed or reloaded — the normal classroom case — the recovery path is: Continue in this window → scroll → Continue simulation. Within one uninterrupted session the picture is better: browser Back from a task returns either to the previous task’s frozen view or to the briefing with the resume controls, because the “expanded” state is remembered in memory (`intro.tsx`). Impact: medium–high in a classroom, where sessions are interrupted and resumed on the same device.

**10. The phone briefing puts the start button last.** *Observed.* On desktop the name field and “Start simulation” sit beside the briefing text. On a phone the order is heading → bullets → “Choose how you work” with two collapsible sections → “What should we call you?” → Start. Impact: medium; the first screen a learner meets asks them to read advice before they can do the one thing they came to do.

**11. The logo is the only persistent exit and it does not say where it goes.** *Observed.* The art’otel logo is “Back to the start”; it leaves the task with no confirmation and no message that progress is kept (it is). Where it lands depends on session state: the briefing with resume controls in a live session, the marketing landing after a reload. Impact: low–medium.

**11a. Redirects away from locked pages use push, not replace.** *Observed in code.* A locked task URL and `/close` before the day is complete both call `setLocation(...)` without `replace`, so the forbidden URL stays in history; pressing Back returns to it and immediately pushes the redirect again. A learner who reaches a locked page by mistake can find Back no longer works as expected (`kitchen-frame.tsx`, `close.tsx`). Impact: low–medium; one-line fix.

**12. Moving between tasks is an abrupt route change with no focus management.** *Observed in code.* “On to the next job” completes the task and navigates immediately. The next task mounts with a new time, room and character, but focus is not moved to anything and nothing is announced; `kitchen-frame.tsx` contains no focus calls, whereas the close page deliberately focuses its heading. A screen-reader user does not hear that Task 2 has begun; a sighted learner gets no completion moment for the task they have just finished. Impact: medium (accessibility and reward).

### D. Consistency of the tools

**13. The notebook is offered everywhere but only fills in three of the five tasks.** *Observed in code.* Entries are written with `jot()` from Task 1 (corridor, inspection), Task 3 (chiller) and Task 5 (pass). The active Task 2 path (`goods-in-redesign.tsx`) and the Task 4 workspaces (`chart-`, `guests-`, `board-workspace.tsx`) never write to it, so the notebook reads “Nothing written down yet.” for the whole of those tasks. It also filters entries to the current task, so Task 1’s notes are invisible while writing the Task 5 handover, where they would be most useful. Impact: medium — a header tool that sometimes does nothing teaches learners to ignore it.

**14. “Tick everything off to move on” is a button that does nothing.** *Observed.* The job-card footer renders it as an outline button with `cursor-not-allowed` but not `disabled`; screen readers announce an actionable button. Impact: low.

**15. The phone header loses most of its orientation cues.** *Observed.* At 390 px the task title truncates (“Take the h…”), the clock is hidden, the current place is hidden, and the tool buttons (two in Task 1, which has no map; three elsewhere) are icons only. “Task 1 of 5” and the step-guide title carry everything. Impact: low–medium.

**16. Dialogue covered the bottom of the Task 2 order sheet and typed itself out on every visit.** *Observed; changed on 18 September 2026.* The dialogue now starts as a small chip (person icon + colleague’s name, with an unread dot) at the bottom-left of the stage and only opens when the name is clicked; the word-by-word typing was removed with it. A question with answer buttons (Task 3 at 90 minutes) still opens the bar by itself, because it has to be seen to be answered. New lines are announced to screen readers whether or not the bar is open. What still needs testing is whether learners notice the unread dot and open the chip when a colleague says something that matters (*assumption*).

## Recommended improvements, prioritised

Impact is judged against the issues above; effort is a build estimate within the current code.

| # | Recommendation | Fixes | Impact | Effort |
| --- | --- | --- | --- | --- |
| 1 | **Resume-aware landing.** When saved progress exists, `/` leads with “Continue your shift — Task 3 of 5, 10:45” as the primary button and “Start again” as secondary (keeping the existing confirmation before any saved work is cleared); skip the briefing unless asked. | 9, 11 | High | Low |
| 1a | **Replace, don’t push, on redirects.** Use `setLocation(..., { replace: true })` when bouncing a learner off a locked task or an early `/close`, so Back keeps working. | 11a | Medium | Low |
| 2 | **Phone briefing order.** Put “What should we call you?” and Start directly under the three bullets; collapse device advice below; keep Start visible (sticky bottom) once a name is typed. | 10 | High | Low |
| 3 | **Fix the false “Opening workspace…”.** Keep the action label while the map is open (disabled), reserve the opening state for a real pending action. | 6 | Medium | Low |
| 4 | **Progress badge.** Replace the red “0” with a small ring or “2/5” text beside the job-card label; show nothing until the first criterion is met. | 3 | Medium | Low |
| 5 | **Scroll cues on internal scrollers.** A bottom fade and a “more below” chevron on any workspace whose content exceeds its height, disappearing at the end. Apply to the overnight log, bench, chart, record and job card. | 5 | Medium | Low |
| 6 | **Focus and announce task changes.** On task mount, move focus to the step guide heading and announce “Task 2 of 5 — Check the delivery in, 08:30” through the existing live region. | 12 | Medium | Low |
| 7 | **Real disabled state.** Make the job-card footer `disabled` with the reason as visible text (“3 of 5 done — finish the checklist to move on”). | 14 | Low | Low |
| 8 | **Day strip.** Five labelled markers with times and state (done / now / later) under the header on desktop; on phones, tapping “Task N of 5” opens a sheet with the same list. Completed tasks link to their existing frozen views. | 1, 2 | High | Medium |
| 9 | **One progress language.** Day → Task → Step → Item. Make guide steps *phases* (Task 2: Check the goods → Inspect the fish → Report → Amend → Sign) and show item counts inside the instruction (“Salmon — item 1 of 10”). | 2 | Medium | Medium |
| 10 | **Reconcile room and guide.** Make the first hotspot in Task 2 the route itself (“Go to the back door — the driver is waiting”) rather than a radio pickup that only reveals it; label and dim any hotspot that is not the current step; give the current one the only pulse. When the guide’s target is already on screen, pulse that control once instead of showing a second red button. | 4, 8 | High | Medium |
| 11 | **A scene for the start of Task 4, and no silent drop.** Either start the task in the events kitchen or give the pass a backdrop with a “Go to the events kitchen” hotspot; when a pending action expires, say so in place and offer “Try again” instead of clearing it quietly. | 7 | High | Low–Medium |
| 12 | **Notebook that always has something in it.** Write entries from the Task 2 and Task 4 workspaces; show earlier tasks’ notes as collapsed sections; or hide the notebook where it cannot fill. | 13 | Medium | Medium |
| 13 | **A completion moment between tasks.** A one-to-two-second, skippable “Signed off ✓ 08:30 — next: the delivery” card (static under reduced motion) shown *after* the existing validated `completeTask` has frozen the work and posted its host events, and before the next task mounts. It changes no sign-off wording or gate and doubles as the announcement in 6. | 12 | Medium | Medium |
| 14 | **Phone header redesign.** Two compact lines (Task N of 5 · title / time · place) and the three tools moved to a bottom bar within thumb reach. | 15 | Medium | High |
| 15 | **Dialogue follow-through.** Done on 18 September: on-demand chip, no typing. Remaining: test whether the unread dot is noticed, and consider a one-line preview on the chip for lines that change what the learner should do. | 16 | Low | Low |

Items 1–7 are quick wins and can ship together; 8–13 are the structural changes; 14–15 can wait for user-testing evidence. None of them touches signed task wording, scenario values, completion gates or the frozen sign-off behaviour; the day strip, resume button and completion card all read the existing progress store rather than adding new gates.

## Proposed navigation structure

Keep the current three-layer model and make each layer visible and consistent.

```
Entry      Landing (resume-aware)  →  Briefing (name + Start first; advice below)
Day        Day strip: 06:45 Handover ✓ · 08:30 Delivery ● · 10:45 Chill · 12:30 Dietary · 14:30 Hand on · 15:00 Close
Task       Header (Task N of 5 · title · time · place)  +  Step guide (phase x of y · one action)
Workspace  Close-up or focused workspace with its own local navigation
           (fridge rail 3 of 7 · order sheet items · dish tabs · work areas · waste bins)
Tools      Job card (criteria) · Map (route) · Notebook (evidence) — same three, same order, everywhere
```

Rules that follow from it:

- **Day strip** is read-only navigation: completed tasks open their frozen view, the current task is highlighted, later tasks show their time and name but are not links. It is the only place that answers “what is left?”.
- **Step guide** is the single instruction surface and stays pinned under the header. Its steps are phases, not items; item progress lives in the instruction text and in the workspace’s local counter.
- **Workspaces** always show “where am I in this list” (3 of 7, item 4 of 10, 8 of 14 categories) and a consistent “Back to …” to their parent view on phones.
- **Rooms** are scenery plus labelled entrances: the hotspot for the current step is the only one animated; others are labelled and quiet.
- **Tools** never appear empty without saying why (“Nothing to write down in this job” rather than a blank page).

### Key-journey improvements

| Journey | Today | Proposed |
| --- | --- | --- |
| First start (phone) | Landing → briefing → scroll past advice → name → Start → Task 1 log, button below the fold | Landing → briefing with name and Start visible → Task 1 with a scroll cue on the log and a single highlighted “Open the fridge” |
| Finding the work in a new task | Read the guide, ignore the room’s hotspot, press the guide button, watch the walk | Room hotspots labelled and dimmed except the current one; the guide button and the hotspot are the same instruction |
| Mid-task “where am I?” | Task N of 5 + Step x of y + workspace counter (three vocabularies) | Day strip + phase + item counter in one line of language |
| Resuming after a break | `/` → Continue in this window → scroll → Continue simulation | `/` → “Continue your shift — Task 3 of 5” |
| Looking back at finished work | Only by typing the URL or browser Back | Day strip → completed task → frozen view → “Back to where you were” (existing) |
| Finishing a task | Instant jump to a new room and time | Brief signed-off card, focus moved, next task announced |
| Finishing the day | Long close page, reset at the bottom | Unchanged, plus the day strip fully ticked |

## Where scroll effects and interactive elements would help

Each is tied to a purpose; none is decoration. All degrade to instant state changes under reduced motion and none carries meaning by motion alone. Note that the task shell is a fixed viewport, so these respond to the **workspace scroller**, not window scroll.

1. **Scroll shadows and an end-of-list chevron on internal scrollers** (log, bench, chart, record, job card). Purpose: reveal that content continues; the chevron disappears at the bottom so its absence also carries information.
2. **Step guide that compacts on scroll.** When a workspace is scrolled past its first screen, the guide collapses to one line (phase + action) and expands again at the top. Purpose: keep the instruction visible on a phone without spending a third of the screen on it.
3. **Section highlighting in the allergen chart.** Pin the dish name and an “8 of 14 categories checked” counter while the category list scrolls; highlight the row whose checkbox has focus. Purpose: orientation inside the longest form in the experience.
4. **Fridge rail that follows the current fridge.** When the round advances, scroll the horizontal rail so the current tab is centred (`scrollIntoView({ inline: 'center' })`, smooth unless reduced motion). Purpose: keep “3 of 7” visible on phones where only three tabs fit.
5. **Row anchoring in the order sheet.** Opening an item highlights its row; returning from the phone inspector (“Back to sheet”) scrolls to and pulses that row once. Purpose: keep the learner’s place in a ten-item list.
6. **Single-target spotlight from the guide.** Pressing the guide action when the target control is already visible draws one 600 ms ring around it. Purpose: connect the instruction to the control instead of duplicating the button.
7. **Day-strip fill on sign-off.** A 300 ms fill and tick on the completed task marker, with the next marker taking the “now” state. Purpose: confirm and reward progress at the moment it happens.
8. **Shorter repeat walks.** Keep the first walk between two rooms at full length (it teaches the layout); cut later walks between the same rooms to ~300 ms. Purpose: keep the mental model without making the learner wait every time.
9. **New-line indicator on the speaker chip.** Now in place: a new line marks the chip with a dot and is announced through a live region. A possible next step is a brief one-line preview that slides out of the chip and retracts (static under reduced motion) when the line changes what the learner should do next. Purpose: stop feedback from being missed behind a workspace.
10. **Visible arrival state.** During a room change show the destination name (“Walking to the back door…”) in place of the black stage. Purpose: replace an unexplained wait with a described one.

## Observed problems versus assumptions to test

**Observed (fix on evidence already gathered):** items 1–6 and 8–16 above — no task overview; mixed progress vocabularies; “0” badge; a Task 2 opening hotspot that does not match the guide; missing scroll cues; false “Opening workspace…”; returning learners not recognised after a reload; phone briefing order; abrupt task change without focus management; push-based redirects; notebook empty in Tasks 2 and 4; non-disabled footer button; truncated phone header; Task 4 starting on a black stage.

**Already changed during this review:** the dialogue bar (16) now opens on demand from the colleague chip; the Task 2 pass now offers a single “Head to the back door” hotspot instead of the radio pickup (first half of recommendation 10); the guide’s item labels read in lower case mid-sentence (“Open salmon fillet, skin on”); Task 4 now starts in the events kitchen (7), and the unused `dietary/pass.tsx` scene has been removed.

**Assumptions that need learner testing before building:**

- Whether learners actually want a day overview or are content with “Task N of 5” (affects the size of item 8).
- Whether the two-button pattern in Task 1 confuses or reassures.
- Whether “Expand experience” should remain the primary landing button inside an LMS iframe, where fullscreen may be blocked.
- Whether the typing effect and the “More/Less” fold slow learners down on repeat visits.
- How many learners explore rooms by tapping hotspots rather than following the guide.
- Time on task and fatigue for Task 2 (thirteen guided steps, ten items).
- Touch-target sizes on real phones: the `pointer: coarse` rule that enlarges controls could not be exercised in desktop emulation, so this pass did not measure it.
- Physical keyboard, screen-reader and LMS-embedding behaviour, as the earlier accessibility review already notes.

## Limits of this pass

Captures used the learning-designer fixtures and the development server; the development banner and designer panel were hidden from captures and are not present for learners. Later phases of each task (for example the 90-minute decision in Task 3 or the handover exchange in Task 5) were reviewed from code and the earlier task reviews rather than re-captured. No changes were made to the application.
