"use client";

import type { CSSProperties } from "react";
import { useDotMatrixPhases, usePrefersReducedMotion, useSteppedCycle } from "./dotmatrix-hooks";
import {
  styleOpacity,
  stylePx,
  remapOpacityToTriplet,
  DotMatrixCommonProps,
  cx,
} from "./dotmatrix-core";

export type TriangleAttitudeWaveProps = DotMatrixCommonProps;

const MATRIX_SIZE = 7;
const STEP_COUNT = 36;
const BASE_OPACITY = 0.08;
const MID_OPACITY = 0.34;
const HIGH_OPACITY = 0.94;

const TRIANGLE_CELLS = new Set([
  "1,3",
  "2,2",
  "2,4",
  "3,1",
  "3,3",
  "3,5",
  "4,0",
  "4,2",
  "4,4",
  "4,6",
]);

function isWithinTriangleMask(row: number, col: number): boolean {
  if (row < 0 || row >= MATRIX_SIZE || col < 0 || col >= MATRIX_SIZE) {
    return false;
  }

  return TRIANGLE_CELLS.has(`${row},${col}`);
}

export function TriangleAttitudeWave({
  size = 30,
  dotSize = 4,
  color = "currentColor",
  ariaLabel = "Loading",
  className,
  muted = false,
  dotClassName,
  speed = 1,
  animated = true,
  hoverAnimated = false,
  cellPadding,
  opacityBase,
  opacityMid,
  opacityPeak,
}: TriangleAttitudeWaveProps) {
  const reducedMotion = usePrefersReducedMotion();
  const {
    phase: matrixPhase,
    onMouseEnter,
    onMouseLeave,
  } = useDotMatrixPhases({
    animated: Boolean(animated && !reducedMotion),
    hoverAnimated: Boolean(hoverAnimated && !reducedMotion),
    speed,
  });
  const step = useSteppedCycle({
    active: !reducedMotion && matrixPhase !== "idle",
    cycleMsBase: 1550,
    speed,
    steps: STEP_COUNT,
  });

  const frame = reducedMotion || matrixPhase === "idle" ? 0 : step;
  const progress = frame / STEP_COUNT;

  const gap =
    cellPadding ?? Math.max(1, Math.floor((size - dotSize * MATRIX_SIZE) / (MATRIX_SIZE - 1)));
  const matrixSize = dotSize * MATRIX_SIZE + gap * (MATRIX_SIZE - 1);
  const rootStyle = {
    color,
    height: stylePx(cellPadding == null ? size : matrixSize),
    width: stylePx(cellPadding == null ? size : matrixSize),
  } as CSSProperties;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={cx("dmx-root", muted && "dmx-muted", className)}
      style={rootStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="dmx-grid"
        style={{
          gap,
          gridTemplateColumns: `repeat(${MATRIX_SIZE}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${MATRIX_SIZE}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: MATRIX_SIZE * MATRIX_SIZE }).map((_, index) => {
          const row = Math.floor(index / MATRIX_SIZE);
          const col = index % MATRIX_SIZE;
          const isActive = isWithinTriangleMask(row, col);

          let opacity = 0;
          if (isActive) {
            const rowPhase = (4 - row) * 0.13;
            const pulse = 0.5 - 0.5 * Math.cos((progress + rowPhase) * Math.PI * 2);
            const crest = pulse * pulse;
            const altitudeWeight = 0.58 + (4 - row) * 0.16;
            const centerWeight = col === 3 ? 0.16 : 0;

            opacity =
              BASE_OPACITY +
              pulse * (MID_OPACITY - BASE_OPACITY) +
              crest * (altitudeWeight + centerWeight) * (HIGH_OPACITY - MID_OPACITY);

            opacity = Math.min(HIGH_OPACITY, opacity);
          }

          return (
            <span
              key={index}
              aria-hidden="true"
              className={cx("dmx-dot", !isActive && "dmx-inactive", dotClassName)}
              style={{
                height: stylePx(dotSize),
                opacity: styleOpacity(
                  remapOpacityToTriplet(opacity, opacityBase, opacityMid, opacityPeak),
                ),
                width: stylePx(dotSize),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
