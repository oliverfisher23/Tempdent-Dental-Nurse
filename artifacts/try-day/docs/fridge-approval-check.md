# Fridge approval drift check

## Purpose and baseline

The current content-owner decision is recorded in
`src/client/assets/kitchen/inspections/APPROVAL.md`. It covers 14 supplied clips and
seven appliance/clue pairings as **simulation illustrations**, with the
limitations stated there. This check detects drift from that decision; it does
not review the truth of findings or establish ownership, rights, site
provenance or food safety.

`tests/fixtures/fridge-approval/` contains byte-for-byte copies of the two
approved source files plus per-file media fingerprints. Before using this
baseline, the check verifies the source copies against the two SHA-256 values
in `APPROVAL.md` and recomputes the documented combined media inventory hash.
Those three existing approval fingerprints were verified before the fixtures
were created. The approval record and learner content were not changed.

The additional decoded-media fingerprints are diagnostic evidence derived
from those exact approved files, not a new approval. They cover every decoded
RGB frame, frame timing, dimensions, aspect ratio and stream types, rather
than sampling a few stills. They exclude FFmpeg's software-version header.

## Run

From the workspace root:

```sh
pnpm --filter @workspace/scripts exec tsx --tsconfig=../artifacts/try-day/tsconfig.json --test ../artifacts/try-day/tests/fridge-approval.test.ts
```

The existing `tests/*.test.ts` command also includes this check. Node/tsx and
FFmpeg (`ffmpeg` and `ffprobe`, including libx264) are needed for the mutation
demonstrations. Matching media only needs file hashing; decoding is performed
when bytes differ. A missing decoder, unreadable file or decoding failure
cannot turn a byte mismatch into a pass.

The tests exercise the unchanged set and temporary changed copies. They never
overwrite source files or shipped media, and do not update the baseline. An
assertion failure produces a non-zero exit status and lists the material to
review.

## Reading a failure

- **`content-change`** — mapping, source identity, appliance membership or
  inspection data changed. The report gives the field path and approved/current
  values. Findings use appliance and clue IDs, for example
  `inspection/larder-2/clues/food/finding`. Labels, coordinates, order, alt
  text, contents, and added/removed clues are also checked.
- **`source-only-change`** — source bytes changed but the parsed/exported
  data is equal. Review formatting or code changes rather than assuming a
  changed finding. This still fails the exact snapshot check.
- **`technical-media-change`** — file bytes changed, but the complete decoded
  presentation fingerprint matches. A remux, metadata edit or lossless
  re-encode is a candidate explanation. This is **not automatic acceptance**:
  a human still checks the change and decides the appropriate action.
- **`media-review`** — bytes changed and decoded presentation differs, the file
  is new, or decoding cannot be completed. A known substitution names the
  other approved asset whose bytes now occupy the slot. Other differences
  may be replacement footage **or a lossy re-encode**; the check cannot decide
  semantic equivalence. Changed WebM alternatives and WebP posters count too.
- **`missing-media` / `invalid-source`** — a referenced asset cannot be read or
  the manifest is invalid. Restore it or investigate; do not bypass the check.

Byte hashes are the pass/fail authority. Decoded similarity is only a review
aid, never a reason to pass changed bytes. Lossy encoders and different
decoder/conversion versions can change decoded pixels without changing the
intended scene, so a `media-review` result does not prove substantive editing.
The report deliberately leaves that judgement to the reviewer.

## Human review, not automatic renewal

1. Compare the named files, mappings and clues with the recorded material.
   For a technical conversion, retain the previous approved media and the
   conversion details so the reviewer can compare them.
2. Ask the content owner to decide whether the change is only a technical
   presentation change or needs fresh content/pairing sign-off. Reassess rights
   separately when relevant; a hash check cannot do so.
3. Record that decision and its scope explicitly before intentionally updating
   the reference files/fingerprints. Preserve the earlier decision as history;
   do not silently rewrite its date, hashes or scope to make tests pass.

There is no update/accept switch, automatic fixture regeneration or approval
renewal in this check. It changes no learner requirements, readings,
completion rules or safety guidance, and publishes nothing.