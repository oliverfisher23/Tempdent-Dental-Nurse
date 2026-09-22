# Fridge inspection media: learner-use approval

## Decision

- **Date:** 2026-09-18.
- **Status:** the four retained closed/interior pairs are covered by the
  supplied clips cleared for the intended learner use.
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

The beginning, midpoint and near-end frames of each of the eight retained MP4
clips, each approximately five seconds long, were visually compared with the
matching findings.
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

### Freezer 1 — approved

- **Check the packs:** “The packs are frozen solid with no soft edges or liquid in the trays.”
- **Check for ice:** “There is no heavy ice build-up around the door or shelves.”
- **Review:** wrapped meat and shelves without obvious heavy ice build-up
  broadly match. Frozen firmness cannot be established visually.

## Approved snapshot

These SHA-256 fingerprints identify the material present when approval was
recorded. They identify files, not media ownership or food-safety evidence.
Changed media or findings are not automatically covered by this sign-off.

| Item | SHA-256 |
| --- | --- |
| `src/content/fridge-media.json` | `a4702f89858c156f75766114c3fd456edf6b8ba3384a08669afce1c4ec89ff72` |
| `src/content/fridge-photos.ts` | `142c2cd19faaa58342d41e594a61a457433e196c47ad16c16796d1b305d97ae4` |
| Combined inventory of the 24 mapped MP4, WebM and WebP files | `243e3896d768c7590cd44b4860bf8dc1d08d8f3ced3da5e80618e82b20b4b412` |

For the combined inventory, enumerate each manifest state's `video`, `webm`
and `poster` filename, hash that file in `videos/`, and sort by filename.
Construct one UTF-8 line per file as `<lowercase SHA-256><two spaces><filename>`
with an LF after every line, including the last. Hash the concatenated lines.
The WebM encodings and WebP posters are existing derived presentations of the
eight retained supplied clips, not 16 additional source clips.

Presentation note, 2026-09-22: the four `closed` WebP stills were re-extracted
from the first frame (0 s) of the same approved `closed` clips, so the picture
shown before "Open the fridge" is the shut door the clip starts from rather
than the half-open door at 2.5 s. The inventory fingerprint above was updated
for those four files only; the eight clips, the eight WebM encodings, the four
interior stills, the source mapping and the findings are unchanged from the
approved snapshot (previous inventory fingerprint
`c874874979c8e801ccd67d6697f8f9f10d64fa8ae04936fafb685c6cd483b658`).

Only this record and its README link were added to the media documentation.
The source mapping, clips, findings, readings, completion rules, and approved
safety guidance were left unchanged. Nothing was published.

Copy note, 2026-09-22: Punctuation-only house-style changes (Oxford commas) were applied to the findings text under the client's style guide; the substance of every finding is unchanged. Changed strings: “Prepared vegetables, covered stocks and fresh produce.” to “Prepared vegetables, covered stocks, and fresh produce.”; “Larder fridge with covered rice, cut melon and other prepared food in separate containers.” to “Larder fridge with covered rice, cut melon, and other prepared food in separate containers.”; “Cooked rice, cut melon and prepared food.” to “Cooked rice, cut melon, and prepared food.”; and “The fish is covered, separated and sitting over ice. It feels properly cold.” to “The fish is covered, separated, and sitting over ice. It feels properly cold.”