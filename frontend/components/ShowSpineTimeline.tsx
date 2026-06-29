'use client';

import React, { useEffect, useRef } from 'react';

export interface LaneCue {
  id: string;
  title: string;
  laneIndex: number; // which role lane
  segmentIndex: number; // position along the spine
  color: string; // gate color
  active: boolean; // currently selected
  evaluated: boolean;
}

interface Props {
  lanes: string[]; // role lane labels
  segments: string[]; // segment columns
  cues: LaneCue[];
  reducedMotion?: boolean;
  // travel: 0..1 of a cue pulse traveling along the spine during evaluation.
  travel?: number;
  travelColor?: string;
}

// A device-pixel-ratio aware canvas. It draws the show spine as a horizontal
// timeline with stacked role lanes; cue cards sit at segment columns and a
// light pulse travels along the spine during an evaluation round.
export default function ShowSpineTimeline({
  lanes,
  segments,
  cues,
  reducedMotion = false,
  travel = -1,
  travelColor = '#ffb84d',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);
  const t = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const hexToRgb = (hex: string) => {
      const m = hex.replace('#', '');
      const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    };

    const draw = () => {
      t.current += reducedMotion ? 0 : 0.016;
      ctx.clearRect(0, 0, w, h);

      const padL = 96;
      const padR = 20;
      const padT = 30;
      const padB = 18;
      const laneCount = Math.max(lanes.length, 1);
      const segCount = Math.max(segments.length, 1);
      const laneH = (h - padT - padB) / laneCount;
      const colW = (w - padL - padR) / segCount;

      // segment column ticks
      ctx.font = '10px IBM Plex Mono, monospace';
      ctx.textBaseline = 'middle';
      for (let s = 0; s < segCount; s++) {
        const x = padL + colW * (s + 0.5);
        ctx.strokeStyle = 'rgba(246,231,200,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, padT - 8);
        ctx.lineTo(x, h - padB);
        ctx.stroke();
        ctx.fillStyle = 'rgba(140,133,151,0.85)';
        ctx.textAlign = 'center';
        const label = segments[s] || '';
        ctx.fillText(label.length > 14 ? label.slice(0, 13) + '...' : label, x, padT - 16);
      }

      // role lanes
      for (let l = 0; l < laneCount; l++) {
        const y = padT + laneH * (l + 0.5);
        // lane rail
        ctx.strokeStyle = 'rgba(77,235,255,0.1)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        // lane label
        ctx.fillStyle = 'rgba(205,195,176,0.9)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        const lab = lanes[l] || '';
        ctx.fillText(lab.length > 12 ? lab.slice(0, 11) + '...' : lab, 12, y);
      }

      // cue nodes
      for (const cue of cues) {
        const y = padT + laneH * (Math.min(cue.laneIndex, laneCount - 1) + 0.5);
        const x = padL + colW * (Math.min(cue.segmentIndex, segCount - 1) + 0.5);
        const { r, g, b } = hexToRgb(cue.color);
        const pulse = reducedMotion ? 1 : 0.7 + Math.sin(t.current * 2 + cue.segmentIndex + cue.laneIndex) * 0.3;
        const radius = cue.active ? 9 : 6.5;
        // glow
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.14 * pulse})`;
        ctx.fill();
        // node
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${cue.evaluated ? 0.95 : 0.5})`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
        ctx.shadowBlur = cue.active ? 18 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (cue.active) {
          ctx.strokeStyle = 'rgba(246,231,200,0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // traveling pulse along the spine during evaluation
      if (travel >= 0) {
        const { r, g, b } = hexToRgb(travelColor);
        const x = padL + (w - padL - padR) * travel;
        ctx.save();
        const grad = ctx.createLinearGradient(x - 60, 0, x, 0);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0.5)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 60, padT - 8);
        ctx.lineTo(x, padT - 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, padT - 14);
        ctx.lineTo(x, h - padB);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, padT - 8, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.restore();
      }

      if (!reducedMotion && document.visibilityState === 'visible') {
        raf.current = requestAnimationFrame(draw);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !reducedMotion) {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(raf.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    draw();
    if (reducedMotion) cancelAnimationFrame(raf.current);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [lanes, segments, cues, reducedMotion, travel, travelColor]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
