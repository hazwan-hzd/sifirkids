"use client";

/*
  Secret Gold cinematic. Dynamically imported (ssr:false) from PackOpening, so
  Three.js only enters the client bundle when a Secret Gold is actually pulled.

  The card face is drawn to a 2D canvas and used as a CanvasTexture, so it works
  with zero hosted art today (emoji + name on a gold card). When real art lands,
  swap the canvas draw for a TextureLoader on the card PNG.
*/

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Card } from "@/lib/types";

interface Props {
  card: Card;
  onDone: () => void;
}

function drawCardTexture(card: Card): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 716;
  const g = c.getContext("2d")!;

  // Gold gradient body
  const grad = g.createLinearGradient(0, 0, 512, 716);
  grad.addColorStop(0, "#fde68a");
  grad.addColorStop(0.45, "#f59e0b");
  grad.addColorStop(0.7, "#b45309");
  grad.addColorStop(1, "#fbbf24");
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 716);

  // Inner frame
  g.strokeStyle = "rgba(120,53,15,0.8)";
  g.lineWidth = 10;
  g.strokeRect(20, 20, 472, 676);

  // Art window
  g.fillStyle = "rgba(255,255,255,0.18)";
  g.fillRect(48, 120, 416, 360);
  g.font = "200px serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#fffbeb";
  g.fillText(card.emoji ?? "⭐", 256, 300);

  // Name
  g.fillStyle = "#451a03";
  g.font = "bold 40px sans-serif";
  g.fillText(card.name.slice(0, 18), 256, 70);

  // Rarity ribbon
  g.fillStyle = "#451a03";
  g.font = "bold 30px sans-serif";
  g.fillText("★ SECRET GOLD ★", 256, 540);

  // Stats
  g.font = "bold 28px sans-serif";
  g.fillText(`${card.attackName ?? "Attack"}  ${card.attackDmg ?? ""}`, 256, 610);
  g.font = "22px sans-serif";
  g.fillText(`HP ${card.hp ?? ""}`, 256, 660);

  return c;
}

export function SecretGoldCinematic({ card, onDone }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xfff3c4, 1.1);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // Radial glow behind the card (additive)
    const glowTex = new THREE.CanvasTexture(makeGlow());
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffcf5a,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    glow.scale.set(9, 9, 1);
    glow.position.z = -1;
    scene.add(glow);

    // The card plane
    const tex = new THREE.CanvasTexture(drawCardTexture(card));
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const card3d = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 3.5),
      new THREE.MeshStandardMaterial({
        map: tex,
        metalness: 0.4,
        roughness: 0.35,
        emissive: new THREE.Color(0x4a2c00),
        emissiveIntensity: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    card3d.position.y = reduce ? 0 : -5;
    scene.add(card3d);

    // Orbiting sparkles
    const sparkleTex = new THREE.CanvasTexture(makeGlow());
    const sparkles: THREE.Sprite[] = [];
    const SPARKLE_COUNT = reduce ? 0 : 60;
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: sparkleTex,
          color: i % 3 === 0 ? 0xffffff : 0xffd166,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        }),
      );
      const sc = 0.1 + Math.random() * 0.2;
      s.scale.set(sc, sc, 1);
      resetSparkle(s);
      sparkles.push(s);
      scene.add(s);
    }

    function resetSparkle(s: THREE.Sprite) {
      s.position.set(
        (Math.random() - 0.5) * 5,
        -2.2 - Math.random() * 1.5,
        (Math.random() - 0.5) * 2,
      );
      s.userData.speed = 0.01 + Math.random() * 0.03;
    }

    let frame = 0;
    let raf = 0;
    const start = performance.now();
    const SPIN_MS = 1600;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const elapsed = performance.now() - start;
      frame++;

      if (!reduce) {
        const p = Math.min(elapsed / SPIN_MS, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        card3d.position.y = -5 + eased * 5;
        card3d.rotation.y = (1 - p) * Math.PI * 4; // multiple spins settling to face
        // gentle idle float after settle
        if (p >= 1) {
          card3d.position.y = Math.sin(elapsed * 0.002) * 0.08;
          card3d.rotation.y = Math.sin(elapsed * 0.0012) * 0.15;
        }
        glow.material.rotation += 0.003;
        glow.scale.setScalar(8.5 + Math.sin(elapsed * 0.003) * 0.6);

        for (const s of sparkles) {
          s.position.y += s.userData.speed as number;
          s.position.x += Math.sin((frame + s.position.y) * 0.05) * 0.004;
          if (s.position.y > 3) resetSparkle(s);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const continueTimer = window.setTimeout(
      () => setShowContinue(true),
      reduce ? 300 : 2200,
    );

    const onResize = () => {
      const nw = mount.clientWidth || window.innerWidth;
      const nh = mount.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(continueTimer);
      window.removeEventListener("resize", onResize);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
          o.geometry?.dispose?.();
          const m = o.material as THREE.Material | THREE.Material[];
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m?.dispose?.();
        }
      });
      glowTex.dispose();
      sparkleTex.dispose();
      tex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [card]);

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-amber-950 via-black to-amber-950/90">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute inset-x-0 top-10 text-center pointer-events-none">
        <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-amber-300 animate-pulse">
          Secret Gold!
        </p>
        <h2 className="font-display text-3xl font-extrabold text-amber-100 drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]">
          {card.name}
        </h2>
      </div>
      {showContinue && (
        <button
          onClick={onDone}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 font-display text-sm font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 px-8 py-3 rounded-full shadow-lg active:scale-95 transition-transform animate-rise"
        >
          Amazing! Continue
        </button>
      )}
    </div>
  );
}

/** Soft radial glow texture used for the backdrop and sparkles. */
function makeGlow(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,224,130,0.8)");
  grad.addColorStop(1, "rgba(255,224,130,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return c;
}
