Add click-and-drag panning to the scale explainer image when it is in maximized/fullscreen mode.

### What we will change
Only `src/components/scales/ScaleExplainerDialog.tsx`.

### Behavior
- When the dialog is in normal size, image keeps current `object-contain` behavior and clicking it maximizes.
- When maximized:
  - The image is rendered at a larger intrinsic/zoomed size inside an `overflow-hidden` container.
  - The user can click and drag to pan the image around and reveal parts outside the viewport.
  - Cursor changes from `grab` (idle) to `grabbing` (dragging).
  - Panning stops at the image edges so the user never sees empty space beyond it.
  - A single click without dragging still minimizes the image (same as today).
  - A drag gesture does not trigger minimize.
- Pan position resets whenever the image is minimized or the dialog closes.

### Technical notes
- Add local state for `pan` (`{ x, y }`), `isDragging`, and `dragStart`/`lastPan` refs.
- Attach `pointerdown`, `pointermove`, `pointerup`/`pointerleave` handlers to the image container.
- Compute boundaries dynamically using the image and container element rects.
- Preserve existing `maximize`/`minimize` header button and `Esc` key behavior.

### Files changed
- `src/components/scales/ScaleExplainerDialog.tsx`