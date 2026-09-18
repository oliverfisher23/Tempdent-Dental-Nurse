# Task 1 refrigerator visuals

The clips in `videos/` are user-supplied simulation media from
`attached_assets/VIDEOS_1789733068766.zip`. They are not verified site footage,
site photographs, or evidence of an actual art'otel kitchen. Appliance names,
temperatures, limits, and findings remain defined by the activity.

## Learner-use approval

On 2026-09-18, the user confirmed they were authorised to clear all 14 clips
for the intended learner use and approved all seven closed/interior pairings
as simulation illustrations, with the reviewed limitations. No replacements
or additional conditions were requested.

See [the approval record](APPROVAL.md) for the exact confirmation, each pair's
matching findings, accepted limitations, and the approved asset snapshot.
This is content approval only, not authorisation to publish or change the
activity's readings, completion rules, or approved safety guidance.

## Source mapping

| Appliance | State | Exact archive path |
| --- | --- | --- |
| walk-in | closed | `VIDEOS/Walk in fridge/7eb44cb6-f7e5-417b-abdb-bd148939a82a.mp4` |
| walk-in | open | `VIDEOS/Walk in fridge/fc1f60bd-e556-431d-ad97-93c790b2f502.mp4` |
| larder-1 | closed | `VIDEOS/Larder fridge 1/c5de4342-09c5-4aeb-99ea-104dca112ac7.mp4` |
| larder-1 | open | `VIDEOS/Larder fridge 1/35be8c03-7eea-4021-bcf4-caa897fadedc.mp4` |
| larder-2 | closed | `VIDEOS/Larder fridge 2/ace56ee9-3aa9-43e7-a50f-aeeae8a07d1b.mp4` |
| larder-2 | open | `VIDEOS/Larder fridge 2/54d61ed4-9310-4cf8-80b9-249bf44765b1.mp4` |
| fish | closed | `VIDEOS/Fish fridge/6e3167ae-52d6-4b20-8a5a-378686cb3ec3.mp4` |
| fish | open | `VIDEOS/Fish fridge/f5546038-06b0-407e-9154-3bb926b9e2b2.mp4` |
| dairy | closed | `VIDEOS/Dairy fridge/711b1ce4-15e8-4798-8a14-c7bdb7d2cc84.mp4` |
| dairy | open | `VIDEOS/Dairy fridge/0065e34f-179b-49a5-8484-fd952780cc34.mp4` |
| freezer-1 | closed | `VIDEOS/Freezer 1/b0ba4ff8-8c13-49df-a8be-989690cd8465.mp4` |
| freezer-1 | open | `VIDEOS/Freezer 1/9785aff9-b9ab-47cb-bce4-7cc577c7bea6.mp4` |
| freezer-2 | closed | `VIDEOS/Freezer 2/830503ed-eaee-4e4e-bf6a-578c8ee7ea0c.mp4` |
| freezer-2 | open | `VIDEOS/Freezer 2/a5dc33f0-52d1-477e-80be-f2bd7ebcb4ba.mp4` |

Only these 14 entries were extracted; ZIP metadata was excluded. Each video
stream was losslessly remuxed with its original 720 × 1280, 24 fps
H.264/yuv420p portrait framing, all audio was removed, and the MP4 `moov` atom
was moved before media data for browser fast start. A silent 720 × 1280, 24 fps
VP9 WebM alternative was encoded at CRF 28 for browsers without proprietary
H.264 decoding. Matching WebP posters are quality-88 frames sampled at 2.5
seconds.

Interior clips were checked with contact sheets sampled at 0, 1, 2, 3, 4, and
5 seconds. Motion is slight and the relevant contents stay in stable shelf
positions throughout: produce and covered containers in the walk-in; prepared
containers in both larders; separated fish trays; milk and covered dairy tubs;
wrapped meat packs in freezer 1; and berries, vegetables, and sealed portions in
freezer 2. Clue coordinates target those visible portrait-scene regions.

The warm larder fridge is deliberately not shown steaming or visibly spoiled:
its measured temperature, rather than its appearance, is the relevant evidence.

## Reproduction and checks

From the workspace root, run
`python3 artifacts/try-day/scripts/prepare-fridge-media.py` to reproduce the
assets from the uploaded archive (requires FFmpeg). The script uses only the
allowlisted source entries in `src/content/fridge-media.json`.

Run the media and existing simulation regressions with:

```sh
pnpm --filter @workspace/scripts exec tsx --tsconfig ../artifacts/try-day/tsconfig.json --test ../artifacts/try-day/tests/*.test.ts
```

The asset tests require `ffprobe`. Vite imports the files as URLs, preserving the
configured base path. Only the current appliance/state receives a video source;
the other clips are not preloaded. The files named `closed` contain a door-opening
sequence: show their still poster until the learner chooses Open fridge, play the
opening once, then switch to the looping interior. Do not loop an opening door
behind a button asking the learner to open it. The learner can bypass the opening
with Inspect now; a failed or stalled opening also proceeds to the usable interior.
The desktop paperwork column stays in place throughout this transition.

A session-only motion preference is separate from learner progress and survives
appliance changes and rechecks. Paused/reduced-motion defaults skip the opening
animation and show the interior poster; learners can explicitly resume its motion.
Opening a door never measures, fills in, saves or signs a fridge check.