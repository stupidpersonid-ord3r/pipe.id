import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, RotateCw, X } from "lucide-react";

const OUTPUT_SIZE = 512;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function PhotoAdjuster({
  source,
  onCancel,
  onUse,
}) {
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [busy, setBusy] = useState(false);
  const [imageError, setImageError] = useState("");

  /*
   * Prevent the Settings page behind the adjuster
   * from scrolling.
   */
  useEffect(() => {
    if (!source) return undefined;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [source]);

  if (!source) {
    return null;
  }

  /*
   * Start crop drag.
   */
  function beginDrag(event) {
    event.preventDefault();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: position.x,
      y: position.y,
    };

    event.currentTarget.setPointerCapture?.(
      event.pointerId,
    );
  }

  /*
   * Move photo while cropping.
   */
  function moveDrag(event) {
    if (
      !dragRef.current ||
      dragRef.current.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const dx =
      event.clientX -
      dragRef.current.startX;

    const dy =
      event.clientY -
      dragRef.current.startY;

    const limit =
      40 + (zoom - 1) * 180;

    setPosition({
      x: clamp(
        dragRef.current.x + dx,
        -limit,
        limit,
      ),
      y: clamp(
        dragRef.current.y + dy,
        -limit,
        limit,
      ),
    });
  }

  /*
   * End crop drag.
   */
  function endDrag(event) {
    if (
      dragRef.current?.pointerId ===
      event.pointerId
    ) {
      dragRef.current = null;
    }
  }

  /*
   * Rotate photo 90 degrees.
   */
  function rotatePhoto() {
    setRotation(
      (current) => (current + 90) % 360,
    );
  }

  /*
   * Create final 512x512 JPG.
   */
  async function uploadPhoto() {
    const img = imageRef.current;

    if (
      !img?.complete ||
      !img.naturalWidth ||
      !img.naturalHeight
    ) {
      return;
    }

    setBusy(true);

    try {
      const canvas =
        document.createElement("canvas");

      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Unable to prepare photo.",
        );
      }

      const sourceRatio =
        img.naturalWidth /
        img.naturalHeight;

      let drawW;
      let drawH;

      /*
       * Cover the entire square crop area.
       */
      if (sourceRatio >= 1) {
        drawH =
          OUTPUT_SIZE * zoom;

        drawW =
          drawH * sourceRatio;
      } else {
        drawW =
          OUTPUT_SIZE * zoom;

        drawH =
          drawW / sourceRatio;
      }

      /*
       * Limit the crop movement so empty
       * space cannot appear.
       */
      const maxOffsetX = Math.max(
        (drawW - OUTPUT_SIZE) / 2,
        0,
      );

      const maxOffsetY = Math.max(
        (drawH - OUTPUT_SIZE) / 2,
        0,
      );

      const x =
        (OUTPUT_SIZE - drawW) / 2 +
        clamp(
          position.x,
          -maxOffsetX,
          maxOffsetX,
        );

      const y =
        (OUTPUT_SIZE - drawH) / 2 +
        clamp(
          position.y,
          -maxOffsetY,
          maxOffsetY,
        );

      /*
       * Draw rotated image.
       */
      ctx.save();

      ctx.translate(
        OUTPUT_SIZE / 2,
        OUTPUT_SIZE / 2,
      );

      ctx.rotate(
        (rotation * Math.PI) / 180,
      );

      ctx.translate(
        -OUTPUT_SIZE / 2,
        -OUTPUT_SIZE / 2,
      );

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        img,
        x,
        y,
        drawW,
        drawH,
      );

      ctx.restore();

      /*
       * Convert canvas to JPG.
       */
      const blob = await new Promise(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/jpeg",
            0.92,
          );
        },
      );

      if (!blob) {
        throw new Error(
          "Failed to create photo.",
        );
      }

      /*
       * Send final image back to Settings.
       */
      const file = new File(
        [blob],
        `avatar-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        },
      );

      onUse(file);
    } catch (error) {
      console.error(
        "Photo upload preparation error:",
        error,
      );
    } finally {
      setBusy(false);
    }
  }

  const adjuster = (
    <div className="fixed inset-0 z-[140] h-[100dvh] w-[100vw] overflow-hidden bg-black">
      <div className="flex h-full w-full flex-col bg-slate-950">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-950 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 sm:pt-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Adjust Photo
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Crop dan atur foto profil kamu
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Photo area */}
        <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6">
          <div className="flex h-full w-full items-center justify-center">
            <div
              className="relative aspect-square w-full max-w-[520px] touch-none select-none overflow-hidden rounded-2xl bg-black shadow-2xl"
              onPointerDown={beginDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onContextMenu={(event) =>
                event.preventDefault()
              }
            >
              <img
                ref={imageRef}
                src={source}
                alt="Adjust profile photo"
                draggable="false"
                onError={() =>
                  setImageError(
                    "Foto tidak dapat dibaca. Gunakan JPG atau PNG.",
                  )
                }
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: "auto",
                  height: "auto",
                  minWidth: "100%",
                  minHeight: "100%",
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin:
                    "center center",
                }}
              />

              {/* Dark overlay */}
              <div className="pointer-events-none absolute inset-0 bg-black/10" />

              {/* Circular crop guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="aspect-square w-full rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.32)]" />
              </div>

              {/* Instruction */}
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                Geser foto untuk crop
              </div>

              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm font-medium text-white">
                  {imageError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="shrink-0 border-t border-white/10 bg-slate-950 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          {/* Zoom */}
          <div className="mx-auto w-full max-w-[520px]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Zoom
              </span>

              <span className="text-xs font-semibold text-white">
                {zoom.toFixed(1)}×
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(event) =>
                setZoom(
                  Number(event.target.value),
                )
              }
              className="h-2 w-full cursor-pointer accent-emerald-500"
              aria-label="Zoom photo"
            />
          </div>

          {/* Actions */}
          <div className="mx-auto mt-4 flex w-full max-w-[520px] items-center justify-between gap-2">
            {/* Cancel */}
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="min-w-[88px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Rotate */}
            <button
              type="button"
              onClick={rotatePhoto}
              disabled={busy}
              className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RotateCw size={16} />
              Rotate
            </button>

            {/* Upload */}
            <button
              type="button"
              onClick={uploadPhoto}
              disabled={
                busy ||
                Boolean(imageError)
              }
              className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} />

              {busy
                ? "Uploading..."
                : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    adjuster,
    document.body,
  );
}