---
name: Media approval manifest
description: Why placeholder pictures are fingerprinted, how to accept a change, and the node-test loader trap for asset-importing content.
---
# Media approval manifest

- Every client picture is fingerprinted with an approved/placeholder status and the test fails on any unrecorded add, change or delete; accept with `UPDATE_MEDIA_FINGERPRINTS=1` and then set the status by hand.
  **Why:** the employer has supplied no photography or talent; all imagery except the logo is an AI placeholder and any swap must be visible in review. Only mark `approved` for files the client supplied.
- Text inside generated images is unreliable, so labels, expiry dates and tray cards are HTML over neutral photos; generated images are 1024x1024 and get cropped to 16:10 with per-photo offsets.
- Node tests that import content which imports pictures must register the asset loader before a dynamic `await import()`; a static import is hoisted and fails with ERR_UNKNOWN_FILE_EXTENSION ".png".
