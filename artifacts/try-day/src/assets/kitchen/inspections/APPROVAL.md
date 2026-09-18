# Fridge inspection media: learner-use approval

## Decision

- **Date:** 2026-09-18.
- **Status:** all 14 supplied clips cleared for the intended learner use; all
  seven closed/interior pairs approved as simulation illustrations.
- **Authority basis:** the user's explicit confirmation in the content-owner/
  employer approval form. This records that confirmation, not an independent
  verification of licensing or site provenance.
- **Clearance response:** “Yes — I’m authorised to confirm clearance”.
- **Content response:** “Approve all seven as simulation illustrations”.
- **Additional comments:** none supplied for either question.
- **Requested replacements:** none.

The decision was given after the user was shown the seven-pair review and the
shared limitations below. It does not establish that these are photographs or
footage of an actual art'otel kitchen. It does not authorise publishing,
rollout changes, new learner requirements, or changes to readings, completion
rules, existing findings, or approved safety guidance.

## Reviewed material and shared limitations

The set is identified by [the source mapping](README.md#source-mapping) and
`src/content/fridge-media.json`. Findings below are quoted unchanged from
`src/content/fridge-photos.ts`.

The beginning, midpoint and near-end frames of each of the 14 approximately
five-second MP4 clips were visually compared with the matching findings.
This was a sampled content review, not continuous playback certification.

Every clip named `closed` shows the door opening and revealing the interior;
none is a continuously closed-door view. This was disclosed before approval.
The interior clips provide the matching inspection view.

These are illustrations of the scenario, not visual proof of temperature,
freshness, physical feel, readable dates, or historical checks. Findings that
depend on those checks remain supplied simulation information. The approval
accepts the limitations below; it does not assert that missing evidence is
visible.

## Pair-by-pair record

Each decision covers both the `closed` and `open` clips for the named appliance
and their pairing with both existing clue findings.

### Walk-in — approved

- **Check the produce:** “Everything feels properly chilled. The produce is covered and off the floor.”
- **Check the containers:** “The lids are on and there are no spills. Nothing needs adding to the note.”
- **Review:** covered containers and produce stored off the floor match the
  scene. Chilled feel cannot be established from the images.

### Larder 1 — approved

- **Check the top shelf:** “The ready-to-eat food is covered and sitting above the raw ingredients.”
- **Check the door:** “The door shuts cleanly and the seal looks sound.”
- **Review:** covered prepared food above raw ingredients matches the storage
  clue. The opening clip cannot establish correct closure or seal performance.

### Larder 2 — approved

- **Check the door:** “The door is shut now, but the seal feels warm. This matches the overnight log.”
- **Check the food:** “There is cooked rice and cut melon in here. They need moving to larder one while this fridge cools down.”
- **Review:** prepared food and rice are visible; cut melon is not clearly
  identifiable. The warm seal and overnight history remain supplied scenario
  information. Approval does not change the existing moving-food guidance.

### Fish — approved

- **Check the fish:** “The fish is covered, separated and sitting over ice. It feels properly cold.”
- **Check below:** “The shelf underneath is clean and dry. Nothing is dripping onto another tray.”
- **Review:** separate covered fish trays are visible, with no obvious drips
  in the sampled frames. The ice is not clearly visible; cold feel cannot be
  established from the images.

### Dairy — approved

- **Check the dairy:** “The milk and cream are sealed and in date. Everything feels chilled.”
- **Check the pastry cream:** “The pastry cream is covered and labelled. Nothing needs adding to the note.”
- **Review:** milk and covered tubs are visible. Readable dates and the
  pastry-cream label are not apparent; chilled feel is not visual evidence.

### Freezer 1 — approved

- **Check the packs:** “The packs are frozen solid with no soft edges or liquid in the trays.”
- **Check for ice:** “There is no heavy ice build-up around the door or shelves.”
- **Review:** wrapped meat and shelves without obvious heavy ice build-up
  broadly match. Frozen firmness cannot be established visually.

### Freezer 2 — approved

- **Check the berries:** “The berries are loose in the bag, not frozen into one solid block.”
- **Check the pastry:** “The pastry portions are sealed and frozen hard. Nothing needs adding to the note.”
- **Review:** bagged berries and covered portions are visible. Loose berries
  and frozen-hard pastry cannot be confirmed from the images alone.

## Approved snapshot

These SHA-256 fingerprints identify the material present when approval was
recorded. They identify files, not media ownership or food-safety evidence.
Changed media or findings are not automatically covered by this sign-off.

| Item | SHA-256 |
| --- | --- |
| `src/content/fridge-media.json` | `3e813a480dcd52bbc6937913efce8d0f58d645d859829fc88a703f62dec2ed70` |
| `src/content/fridge-photos.ts` | `ffcadce85cc36655bbdf13d85d404e69140fc8b313e0731e2846bcb7b514e47a` |
| Combined inventory of the 42 mapped MP4, WebM and WebP files | `4cba526d17950a4837ef0b7579e701f26500385f791a9ba22362bd76031829b4` |

For the combined inventory, enumerate each manifest state's `video`, `webm`
and `poster` filename, hash that file in `videos/`, and sort by filename.
Construct one UTF-8 line per file as `<lowercase SHA-256><two spaces><filename>`
with an LF after every line, including the last. Hash the concatenated lines.
The WebM encodings and WebP posters are existing derived presentations of the
14 supplied clips, not 28 additional source clips.

Only this record and its README link were added to the media documentation.
The source mapping, clips, findings, readings, completion rules, and approved
safety guidance were left unchanged. Nothing was published.