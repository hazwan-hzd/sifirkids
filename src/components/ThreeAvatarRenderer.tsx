"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ChildAvatar } from "@/lib/types";
import { AVATAR_ITEMS } from "@/lib/avatarItems";

export interface ThreeAvatarRendererProps {
  avatar: ChildAvatar;
  size?: number;
  className?: string;
}

export const ThreeAvatarRenderer: React.FC<ThreeAvatarRendererProps> = ({
  avatar,
  size = 300,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Resolve colors from props/items
    const skinVal = avatar.skin || "skin-fair";
    const skinItem = AVATAR_ITEMS.skin.find((i) => i.id === skinVal);
    const skinColorHex = skinItem?.value || "#ffe0bd";

    const hairColorHex = avatar.hairColor || "#54301a";
    const topColorHex = avatar.topColor || "#1f9bff";
    const dressVal = avatar.dress || "dress-none";
    const dressColorHex = avatar.dressColor || "#ff85a2";
    const bottomColorHex = avatar.bottomColor || "#343a40";
    const accessoryVal = avatar.accessory || "acc-none";
    const accessoryColorHex = avatar.accessoryColor || "#ffd700";

    // 2. Scene setup
    const scene = new THREE.Scene();

    // Camera
    const initWidth = mountRef.current.clientWidth || size;
    const initHeight = mountRef.current.clientHeight || size;

    const camera = new THREE.PerspectiveCamera(45, initWidth / initHeight, 0.1, 100);
    camera.position.set(0, 0.6, 3.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initWidth, initHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // don't go below ground
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.target.set(0, 0.5, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xddeeff, 0.3);
    dirLight2.position.set(-5, 2, -3);
    scene.add(dirLight2);

    // Dynamic lighting based on background
    const bgVal = avatar.background || "bg-white";
    if (bgVal === "bg-sunny" || bgVal === "bg-coral") {
      ambientLight.color.setHex(0xfff5e0);
      dirLight.color.setHex(0xffe8c0);
    } else if (bgVal === "bg-sky" || bgVal === "bg-teal") {
      ambientLight.color.setHex(0xe0f0ff);
      dirLight.color.setHex(0xc0e8ff);
    } else if (bgVal === "bg-grape") {
      ambientLight.color.setHex(0xf0e0ff);
      dirLight.color.setHex(0xe0c8ff);
    } else if (bgVal === "bg-space") {
      ambientLight.color.setHex(0x1a1040);
      ambientLight.intensity = 0.4;
      dirLight.color.setHex(0x4444aa);
      dirLight.intensity = 0.5;
    } else if (bgVal === "bg-rainbow") {
      ambientLight.color.setHex(0xfff0f0);
      dirLight.color.setHex(0xffffff);
      dirLight.intensity = 1.0;
    }
    // bg-white: keep default white lights

    // 3. Procedural geometries group
    const avatarGroup = new THREE.Group();

    // Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinColorHex),
      roughness: 0.6,
      metalness: 0.05,
    });

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColorHex),
      roughness: 0.8,
      metalness: 0.05,
    });

    const topMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(topColorHex),
      roughness: 0.7,
      metalness: 0.05,
    });

    const dressMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dressColorHex),
      roughness: 0.7,
      metalness: 0.05,
    });

    const bottomMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bottomColorHex),
      roughness: 0.7,
      metalness: 0.05,
    });

    const accessoryMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accessoryColorHex),
      roughness: 0.4,
      metalness: 0.6,
    });

    const blackMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
    });

    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
    });

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.85,
    });

    // --- Meshes Construction ---

    // Head
    const headGeo = new THREE.SphereGeometry(0.58, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.set(0, 0.9, 0);
    avatarGroup.add(headMesh);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const leftEar = new THREE.Mesh(earGeo, skinMaterial);
    leftEar.position.set(-0.62, 0.9, 0);
    const rightEar = leftEar.clone();
    rightEar.position.set(0.62, 0.9, 0);
    avatarGroup.add(leftEar);
    avatarGroup.add(rightEar);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.16, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, 0.54, 0);
    avatarGroup.add(neckMesh);

    // Torso & Legs
    if (dressVal !== "dress-none") {
      // Dress
      const dressGeo = new THREE.CylinderGeometry(0.18, 0.42, 0.7, 16);
      const dressMesh = new THREE.Mesh(dressGeo, dressMaterial);
      dressMesh.position.set(0, 0.15, 0);
      avatarGroup.add(dressMesh);

      // Simple legs under dress
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 16);
      const leftLeg = new THREE.Mesh(legGeo, skinMaterial);
      leftLeg.position.set(-0.14, -0.25, 0);
      const rightLeg = leftLeg.clone();
      rightLeg.position.set(0.14, -0.25, 0);
      avatarGroup.add(leftLeg);
      avatarGroup.add(rightLeg);
    } else {
      // Top/Shirt
      const topGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.6, 16);
      const topMesh = new THREE.Mesh(topGeo, topMaterial);
      topMesh.position.set(0, 0.2, 0);
      avatarGroup.add(topMesh);

      // Sleeves
      const sleeveGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.25, 16);
      const leftSleeve = new THREE.Mesh(sleeveGeo, topMaterial);
      leftSleeve.position.set(-0.35, 0.32, 0);
      leftSleeve.rotation.z = Math.PI / 6;
      const rightSleeve = new THREE.Mesh(sleeveGeo, topMaterial);
      rightSleeve.position.set(0.35, 0.32, 0);
      rightSleeve.rotation.z = -Math.PI / 6;
      avatarGroup.add(leftSleeve);
      avatarGroup.add(rightSleeve);

      // Arms
      const armGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 16);
      const leftArm = new THREE.Mesh(armGeo, skinMaterial);
      leftArm.position.set(-0.43, 0.17, 0);
      leftArm.rotation.z = Math.PI / 6;
      const rightArm = new THREE.Mesh(armGeo, skinMaterial);
      rightArm.position.set(0.43, 0.17, 0);
      rightArm.rotation.z = -Math.PI / 6;
      avatarGroup.add(leftArm);
      avatarGroup.add(rightArm);

      // Pants/Bottoms
      const bottomGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.35, 16);
      const leftLeg = new THREE.Mesh(bottomGeo, bottomMaterial);
      leftLeg.position.set(-0.14, -0.2, 0);
      const rightLeg = leftLeg.clone();
      rightLeg.position.set(0.14, -0.2, 0);
      avatarGroup.add(leftLeg);
      avatarGroup.add(rightLeg);
    }

    // Feet
    const footGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const leftFoot = new THREE.Mesh(footGeo, blackMaterial);
    leftFoot.position.set(-0.14, -0.4, 0.06);
    const rightFoot = leftFoot.clone();
    rightFoot.position.set(0.14, -0.4, 0.06);
    avatarGroup.add(leftFoot);
    avatarGroup.add(rightFoot);

    // Eyes
    const eyesVal = avatar.eyes || "eyes-cute";
    if (accessoryVal !== "acc-gojo") {
      if (eyesVal === "eyes-cute") {
        const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const leftEye = new THREE.Mesh(eyeGeo, blackMaterial);
        leftEye.position.set(-0.18, 0.9, 0.53);
        const rightEye = leftEye.clone();
        rightEye.position.set(0.18, 0.9, 0.53);
        avatarGroup.add(leftEye);
        avatarGroup.add(rightEye);

        const glintGeo = new THREE.SphereGeometry(0.018, 8, 8);
        const leftGlint = new THREE.Mesh(glintGeo, whiteMaterial);
        leftGlint.position.set(-0.16, 0.92, 0.58);
        const rightGlint = leftGlint.clone();
        rightGlint.position.set(0.2, 0.92, 0.58);
        avatarGroup.add(leftGlint);
        avatarGroup.add(rightGlint);
      } else if (eyesVal === "eyes-happy") {
        const eyeHappyGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI);
        const leftHappyEye = new THREE.Mesh(eyeHappyGeo, blackMaterial);
        leftHappyEye.position.set(-0.18, 0.9, 0.53);
        leftHappyEye.rotation.x = Math.PI;
        const rightHappyEye = leftHappyEye.clone();
        rightHappyEye.position.set(0.18, 0.9, 0.53);
        avatarGroup.add(leftHappyEye);
        avatarGroup.add(rightHappyEye);
      } else if (eyesVal === "eyes-kawaii") {
        const eyeKawaiiGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const leftKawaiiEye = new THREE.Mesh(eyeKawaiiGeo, blackMaterial);
        leftKawaiiEye.position.set(-0.18, 0.9, 0.53);
        const rightKawaiiEye = leftKawaiiEye.clone();
        rightKawaiiEye.position.set(0.18, 0.9, 0.53);
        avatarGroup.add(leftKawaiiEye);
        avatarGroup.add(rightKawaiiEye);

        const glint1 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), whiteMaterial);
        glint1.position.set(-0.15, 0.94, 0.59);
        const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), whiteMaterial);
        glint2.position.set(-0.21, 0.86, 0.58);

        const rglint1 = glint1.clone();
        rglint1.position.set(0.21, 0.94, 0.59);
        const rglint2 = glint2.clone();
        rglint2.position.set(0.15, 0.86, 0.58);

        avatarGroup.add(glint1);
        avatarGroup.add(glint2);
        avatarGroup.add(rglint1);
        avatarGroup.add(rglint2);
      } else if (eyesVal === "eyes-winking") {
        const rightCute = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), blackMaterial);
        rightCute.position.set(0.18, 0.9, 0.53);
        avatarGroup.add(rightCute);
        const rightCuteGlint = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), whiteMaterial);
        rightCuteGlint.position.set(0.2, 0.92, 0.58);
        avatarGroup.add(rightCuteGlint);

        const leftWinkGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI);
        const leftWink = new THREE.Mesh(leftWinkGeo, blackMaterial);
        leftWink.position.set(-0.18, 0.9, 0.53);
        avatarGroup.add(leftWink);
      } else if (eyesVal === "eyes-sparkle") {
        const starGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const leftStar = new THREE.Mesh(starGeo, goldMaterial);
        leftStar.position.set(-0.18, 0.9, 0.53);
        const rightStar = leftStar.clone();
        rightStar.position.set(0.18, 0.9, 0.53);

        const barGeo = new THREE.BoxGeometry(0.14, 0.03, 0.03);
        const leftBarH = new THREE.Mesh(barGeo, goldMaterial);
        leftBarH.position.set(-0.18, 0.9, 0.54);
        const leftBarV = leftBarH.clone();
        leftBarV.rotation.z = Math.PI / 2;

        const rightBarH = leftBarH.clone();
        rightBarH.position.set(0.18, 0.9, 0.54);
        const rightBarV = rightBarH.clone();
        rightBarV.rotation.z = Math.PI / 2;

        avatarGroup.add(leftStar);
        avatarGroup.add(rightStar);
        avatarGroup.add(leftBarH);
        avatarGroup.add(leftBarV);
        avatarGroup.add(rightBarH);
        avatarGroup.add(rightBarV);
      } else if (eyesVal === "eyes-nerd") {
        const leftEyeN = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), blackMaterial);
        leftEyeN.position.set(-0.18, 0.9, 0.53);
        const rightEyeN = leftEyeN.clone();
        rightEyeN.position.set(0.18, 0.9, 0.53);
        avatarGroup.add(leftEyeN);
        avatarGroup.add(rightEyeN);

        const frameGeo = new THREE.TorusGeometry(0.12, 0.02, 8, 24);
        const leftFrame = new THREE.Mesh(frameGeo, blackMaterial);
        leftFrame.position.set(-0.18, 0.9, 0.56);
        const rightFrame = leftFrame.clone();
        rightFrame.position.set(0.18, 0.9, 0.56);
        avatarGroup.add(leftFrame);
        avatarGroup.add(rightFrame);

        const bridgeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12);
        const bridge = new THREE.Mesh(bridgeGeo, blackMaterial);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.set(0, 0.9, 0.57);
        avatarGroup.add(bridge);
      } else if (eyesVal === "eyes-cool") {
        const glassGeo = new THREE.BoxGeometry(0.55, 0.15, 0.04);
        const glasses = new THREE.Mesh(glassGeo, blackMaterial);
        glasses.position.set(0, 0.9, 0.56);
        avatarGroup.add(glasses);

        const templeGeo = new THREE.BoxGeometry(0.03, 0.03, 0.5);
        const leftTemple = new THREE.Mesh(templeGeo, blackMaterial);
        leftTemple.position.set(-0.28, 0.9, 0.32);
        const rightTemple = leftTemple.clone();
        rightTemple.position.set(0.28, 0.9, 0.32);
        avatarGroup.add(leftTemple);
        avatarGroup.add(rightTemple);
      }
    }

    // Smile
    const smileGeo = new THREE.TorusGeometry(0.09, 0.015, 8, 16, Math.PI);
    const smileMesh = new THREE.Mesh(smileGeo, blackMaterial);
    smileMesh.position.set(0, 0.76, 0.54);
    smileMesh.rotation.x = Math.PI / 6;
    smileMesh.rotation.z = Math.PI; // Curve upwards
    avatarGroup.add(smileMesh);

    // Hair Style
    const hairStyleVal = avatar.hairStyle || "hair-short";
    if (hairStyleVal !== "hair-bald") {
      const hairCapGeo = new THREE.SphereGeometry(0.61, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const hairCap = new THREE.Mesh(hairCapGeo, hairMaterial);
      hairCap.position.set(0, 0.9, 0);
      hairCap.rotation.x = -Math.PI / 8;
      avatarGroup.add(hairCap);

      if (hairStyleVal === "hair-short") {
        // bangs
        for (let i = -3; i <= 3; i++) {
          const bang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), hairMaterial);
          bang.position.set(i * 0.12, 1.25, 0.42);
          bang.rotation.x = Math.PI / 3;
          avatarGroup.add(bang);
        }
      } else if (hairStyleVal === "hair-long") {
        // long back strands
        const strandGeo = new THREE.CylinderGeometry(0.09, 0.06, 0.7, 16);
        const leftStrand = new THREE.Mesh(strandGeo, hairMaterial);
        leftStrand.position.set(-0.35, 0.5, -0.15);
        const rightStrand = leftStrand.clone();
        rightStrand.position.set(0.35, 0.5, -0.15);
        avatarGroup.add(leftStrand);
        avatarGroup.add(rightStrand);
      } else if (hairStyleVal === "hair-curly") {
        const curlGeo = new THREE.SphereGeometry(0.14, 16, 16);
        const curlCoords = [
          [-0.3, 1.3, 0.2], [0.3, 1.3, 0.2],
          [-0.4, 1.15, -0.1], [0.4, 1.15, -0.1],
          [-0.15, 1.38, 0.0], [0.15, 1.38, 0.0],
          [0.0, 1.45, -0.15], [-0.4, 0.9, -0.3],
          [0.4, 0.9, -0.3]
        ];
        curlCoords.forEach(([cx, cy, cz]) => {
          const curl = new THREE.Mesh(curlGeo, hairMaterial);
          curl.position.set(cx, cy + 0.05, cz);
          avatarGroup.add(curl);
        });
      } else if (hairStyleVal === "hair-pigtails") {
        const pigtailGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const leftPig = new THREE.Mesh(pigtailGeo, hairMaterial);
        leftPig.position.set(-0.65, 1.15, -0.15);
        const tieGeo = new THREE.TorusGeometry(0.09, 0.03, 8, 16);
        const leftTie = new THREE.Mesh(tieGeo, new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        leftTie.position.set(-0.57, 1.16, -0.15);
        leftTie.rotation.y = Math.PI / 2;

        const rightPig = leftPig.clone();
        rightPig.position.set(0.65, 1.15, -0.15);
        const rightTie = leftTie.clone();
        rightTie.position.set(0.57, 1.16, -0.15);

        avatarGroup.add(leftPig);
        avatarGroup.add(leftTie);
        avatarGroup.add(rightPig);
        avatarGroup.add(rightTie);
      } else if (hairStyleVal === "hair-cool-sweep") {
        const sweepGeo = new THREE.ConeGeometry(0.24, 0.55, 16);
        const sweep = new THREE.Mesh(sweepGeo, hairMaterial);
        sweep.position.set(-0.15, 1.3, 0.35);
        sweep.rotation.z = -Math.PI / 3;
        sweep.rotation.x = Math.PI / 6;
        avatarGroup.add(sweep);
      } else if (hairStyleVal === "hair-spiky") {
        const spikeGeo = new THREE.ConeGeometry(0.09, 0.28, 4);
        const spikeCoords = [
          [-0.22, 1.3, 0.22, 0.2, 0, 0.5],
          [0.22, 1.3, 0.22, 0.2, 0, -0.5],
          [-0.3, 1.38, -0.15, 0.4, 0, 0.8],
          [0.3, 1.38, -0.15, 0.4, 0, -0.8],
          [0.0, 1.5, 0.08, 0.5, 0, 0],
          [-0.15, 1.45, -0.3, 0.6, 0, 0.3],
          [0.15, 1.45, -0.3, 0.6, 0, -0.3],
        ];
        spikeCoords.forEach(([sx, sy, sz, rx, ry, rz]) => {
          const spike = new THREE.Mesh(spikeGeo, hairMaterial);
          spike.position.set(sx, sy, sz);
          spike.rotation.set(rx, ry, rz);
          avatarGroup.add(spike);
        });
      } else if (hairStyleVal === "hair-pinkie") {
        const bubbleGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const bubbleCoords = [
          [-0.26, 1.35, 0.22], [0.26, 1.35, 0.22],
          [-0.45, 1.15, -0.08], [0.45, 1.15, -0.08],
          [-0.52, 0.9, -0.15], [0.52, 0.9, -0.15],
          [0.0, 1.45, 0.08], [-0.22, 1.4, -0.22],
          [0.22, 1.4, -0.22]
        ];
        bubbleCoords.forEach(([bx, by, bz]) => {
          const bubble = new THREE.Mesh(bubbleGeo, hairMaterial);
          bubble.position.set(bx, by, bz);
          avatarGroup.add(bubble);
        });
      }
    }

    // Accessory
    if (accessoryVal !== "acc-none") {
      if (accessoryVal === "acc-hairbow") {
        const bowPartGeo = new THREE.ConeGeometry(0.12, 0.22, 16);
        const leftBowPart = new THREE.Mesh(bowPartGeo, accessoryMaterial);
        leftBowPart.rotation.z = Math.PI / 2;
        leftBowPart.position.set(-0.12, 1.48, 0.15);

        const rightBowPart = leftBowPart.clone();
        rightBowPart.rotation.z = -Math.PI / 2;
        rightBowPart.position.set(0.12, 1.48, 0.15);

        const knotGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const knot = new THREE.Mesh(knotGeo, accessoryMaterial);
        knot.position.set(0, 1.48, 0.15);

        avatarGroup.add(leftBowPart);
        avatarGroup.add(rightBowPart);
        avatarGroup.add(knot);
      } else if (accessoryVal === "acc-anime-headband") {
        const bandGeo = new THREE.TorusGeometry(0.59, 0.04, 8, 24);
        const band = new THREE.Mesh(bandGeo, accessoryMaterial);
        band.position.set(0, 1.05, 0);
        band.rotation.x = Math.PI / 2;
        avatarGroup.add(band);

        const plateGeo = new THREE.BoxGeometry(0.2, 0.07, 0.02);
        const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 }));
        plate.position.set(0, 1.13, 0.54);
        avatarGroup.add(plate);
      } else if (accessoryVal === "acc-headphones") {
        const bandHGeo = new THREE.TorusGeometry(0.63, 0.024, 8, 24, Math.PI);
        const bandH = new THREE.Mesh(bandHGeo, accessoryMaterial);
        bandH.position.set(0, 0.98, 0);
        bandH.rotation.z = Math.PI;
        avatarGroup.add(bandH);

        const cupGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16);
        const leftCup = new THREE.Mesh(cupGeo, accessoryMaterial);
        leftCup.position.set(-0.64, 0.98, 0);
        leftCup.rotation.z = Math.PI / 2;
        const rightCup = leftCup.clone();
        rightCup.position.set(0.64, 0.98, 0);
        avatarGroup.add(leftCup);
        avatarGroup.add(rightCup);
      } else if (accessoryVal === "acc-roblox-cap") {
        const capGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.28, 16);
        const cap = new THREE.Mesh(capGeo, accessoryMaterial);
        cap.position.set(0, 1.4, -0.04);
        avatarGroup.add(cap);

        const brimGeo = new THREE.BoxGeometry(0.6, 0.03, 0.28);
        const brim = new THREE.Mesh(brimGeo, accessoryMaterial);
        brim.position.set(0, 1.3, 0.32);
        avatarGroup.add(brim);
      } else if (accessoryVal === "acc-gojo") {
        const gojoGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 24);
        const gojo = new THREE.Mesh(gojoGeo, blackMaterial);
        gojo.position.set(0, 0.9, 0);
        avatarGroup.add(gojo);
      } else if (accessoryVal === "acc-star-mic") {
        const micBandGeo = new THREE.TorusGeometry(0.62, 0.016, 8, 24, Math.PI);
        const micBand = new THREE.Mesh(micBandGeo, blackMaterial);
        micBand.position.set(0, 0.98, 0);
        micBand.rotation.z = Math.PI;
        avatarGroup.add(micBand);

        const wireGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.4);
        const wire = new THREE.Mesh(wireGeo, blackMaterial);
        wire.position.set(-0.28, 0.82, 0.36);
        wire.rotation.x = Math.PI / 4;
        wire.rotation.z = -Math.PI / 6;
        avatarGroup.add(wire);

        const starTipGeo = new THREE.SphereGeometry(0.05, 16, 16);
        const starTip = new THREE.Mesh(starTipGeo, accessoryMaterial);
        starTip.position.set(-0.18, 0.7, 0.52);
        avatarGroup.add(starTip);
      } else if (accessoryVal === "acc-unicorn") {
        const hornGeo = new THREE.ConeGeometry(0.06, 0.4, 16);
        const horn = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({ color: 0xffaadd, metalness: 0.2, roughness: 0.1 }));
        horn.position.set(0, 1.4, 0.32);
        horn.rotation.x = Math.PI / 6;
        avatarGroup.add(horn);
      } else if (accessoryVal === "acc-crown") {
        const crownRingGeo = new THREE.TorusGeometry(0.35, 0.04, 8, 24);
        const crownRing = new THREE.Mesh(crownRingGeo, goldMaterial);
        crownRing.position.set(0, 1.42, 0);
        crownRing.rotation.x = Math.PI / 2;
        avatarGroup.add(crownRing);

        const spikeCrownGeo = new THREE.ConeGeometry(0.05, 0.12, 4);
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const spike = new THREE.Mesh(spikeCrownGeo, goldMaterial);
          spike.position.set(Math.cos(angle) * 0.35, 1.5, Math.sin(angle) * 0.35);
          avatarGroup.add(spike);
        }
      }
    }

    // Add everything to scene
    avatarGroup.position.y = -0.5; // center the character
    scene.add(avatarGroup);

    // Golden sparkle particles for premium items
    const equippedIds = [
      avatar.skin, avatar.hairStyle, avatar.eyes,
      avatar.top, avatar.dress, avatar.accessory, avatar.background,
    ].filter(Boolean);

    const hasPremiumItem = equippedIds.some((eqId) => {
      for (const category of Object.keys(AVATAR_ITEMS) as (keyof typeof AVATAR_ITEMS)[]) {
        const found = AVATAR_ITEMS[category].find((item) => item.id === eqId);
        if (found && found.cost > 0) return true;
      }
      return false;
    });

    const sparkles: THREE.Mesh[] = [];
    if (hasPremiumItem) {
      const sparkleCount = 8 + Math.floor(Math.random() * 5); // 8-12
      const sparkleGeo = new THREE.OctahedronGeometry(0.03);
      const sparkleMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
      });
      for (let i = 0; i < sparkleCount; i++) {
        const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
        sparkle.position.set(
          (Math.random() - 0.5) * 1.2,
          -0.8 + Math.random() * 0.5,
          (Math.random() - 0.5) * 1.2,
        );
        scene.add(sparkle);
        sparkles.push(sparkle);
      }
    }

    // 4. Animation loop
    let animationFrameId: number;
    let active = true;

    const animate = () => {
      if (!active) return;
      animationFrameId = requestAnimationFrame(animate);

      // Sine-wave float animation
      avatarGroup.position.y = -0.5 + Math.sin(Date.now() * 0.002) * 0.04;

      // Animate sparkle particles
      for (const sparkle of sparkles) {
        sparkle.position.y += 0.005;
        sparkle.rotation.y += 0.03;
        if (sparkle.position.y > 1.5) {
          sparkle.position.set(
            (Math.random() - 0.5) * 1.2,
            -0.8 + Math.random() * 0.5,
            (Math.random() - 0.5) * 1.2,
          );
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 5. Responsive sizing / Resize observer
    const handleResize = () => {
      if (!mountRef.current || !renderer) return;
      const width = mountRef.current.clientWidth || size;
      const height = mountRef.current.clientHeight || size;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(mountRef.current);

    // Initial trigger
    handleResize();

    // 6. Cleanup
    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      if (controls) controls.dispose();

      // Traverse scene and dispose resources
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [avatar, size]);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%' }}
      className={`relative select-none ${className}`}
    />
  );
};
