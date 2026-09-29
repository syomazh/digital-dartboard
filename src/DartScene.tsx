import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Crosshair, LoaderCircle } from "lucide-react";
import { BOARD_RADIUS, SEGMENTS, scoreHit } from "./game";
import type { Hit, Target } from "./game";

type Props = {
  target: Target;
  clearKey: number;
  focused: boolean;
  onHit: (hit: Hit) => void;
  onThrow: () => void;
};
type Controller = { setTarget: (target: Target) => void; clear: () => void };

function canvasTexture(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeBoardTexture() {
  return canvasTexture(2048, 2048, (ctx) => {
    const scale = 475;
    ctx.translate(1024, 1024);
    ctx.fillStyle = "#1b1c18";
    ctx.fillRect(-1024, -1024, 2048, 2048);
    const rings = [0.16, 0.96, 1.07, 1.59, 1.7];
    for (let i = 0; i < 20; i++) {
      const start = -Math.PI / 2 - Math.PI / 20 + (i * Math.PI) / 10;
      const end = start + Math.PI / 10;
      for (let r = 0; r < 4; r++) {
        ctx.beginPath();
        ctx.arc(0, 0, rings[r + 1] * scale, start, end);
        ctx.arc(0, 0, rings[r] * scale, end, start, true);
        ctx.closePath();
        const isBand = r === 1 || r === 3;
        ctx.fillStyle = isBand
          ? i % 2
            ? "#365951"
            : "#9d4034"
          : i % 2
            ? "#d7cdb0"
            : "#272922";
        ctx.fill();
        ctx.strokeStyle = "#aaa28a";
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      const angle = -Math.PI / 2 + (i * Math.PI) / 10;
      ctx.fillStyle = "#e0d7be";
      ctx.font = '500 91px "Barlow Condensed", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        String(SEGMENTS[i]),
        Math.cos(angle) * 1.87 * scale,
        Math.sin(angle) * 1.87 * scale,
      );
    }
    for (const [r, fill] of [
      [0.16, "#365951"],
      [0.065, "#9d4034"],
    ] as const) {
      ctx.beginPath();
      ctx.arc(0, 0, r * scale, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "#b3aa8e";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Fine sisal fibers give the face the irregular finish of a real board.
    let seed = 913;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 85000; i++) {
      const x = random() * 1900 - 950;
      const y = random() * 1900 - 950;
      ctx.fillStyle =
        random() > 0.5 ? "rgba(255,240,207,0.08)" : "rgba(0,0,0,0.14)";
      ctx.fillRect(x, y, random() * 2 + 0.3, random() * 6 + 1);
    }
  });
}

function makeWoodTexture() {
  return canvasTexture(1024, 1024, (ctx) => {
    ctx.fillStyle = "#29251e";
    ctx.fillRect(0, 0, 1024, 1024);
    let seed = 257;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let plank = 0; plank < 8; plank++) {
      const x = plank * 128;
      ctx.fillStyle = `rgba(${random() > 0.5 ? "100,70,38" : "0,0,0"},${0.03 + random() * 0.16})`;
      ctx.fillRect(x, 0, 128, 1024);
      ctx.fillStyle = "#191712";
      ctx.fillRect(x, 0, 3, 1024);
      ctx.fillStyle = "rgba(159,119,75,0.13)";
      ctx.fillRect(x + 3, 0, 1, 1024);
      for (let i = 0; i < 210; i++) {
        const grainX = x + random() * 125;
        ctx.beginPath();
        ctx.moveTo(grainX, 0);
        ctx.bezierCurveTo(
          grainX + random() * 18,
          350,
          grainX - random() * 14,
          700,
          grainX,
          1024,
        );
        ctx.strokeStyle = `rgba(${random() > 0.5 ? "130,103,73" : "0,0,0"},${random() * 0.075})`;
        ctx.lineWidth = random() * 1.7;
        ctx.stroke();
      }
      for (const y of [20, 1002]) {
        ctx.fillStyle = "#171712";
        ctx.beginPath();
        ctx.arc(x + 13, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

function makeDart() {
  const dart = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: "#b5b2a4",
    roughness: 0.3,
    metalness: 0.9,
  });
  const barrel = new THREE.MeshStandardMaterial({
    color: "#857968",
    roughness: 0.35,
    metalness: 0.9,
  });
  const flight = new THREE.MeshStandardMaterial({
    color: "#d27849",
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  function cylinder(
    top: number,
    bottom: number,
    height: number,
    z: number,
    material: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(top, bottom, height, 12),
      material,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = z;
    mesh.castShadow = true;
    dart.add(mesh);
  }
  cylinder(0, 0.012, 0.24, 0.12, metal);
  cylinder(0.029, 0.026, 0.28, 0.38, barrel);
  cylinder(0.012, 0.012, 0.26, 0.64, metal);
  for (let i = 0; i < 9; i++) {
    const groove = new THREE.Mesh(
      new THREE.TorusGeometry(0.029, 0.003, 4, 12),
      metal,
    );
    groove.position.z = 0.26 + i * 0.027;
    dart.add(groove);
  }
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.62);
  shape.lineTo(0.13, 0.8);
  shape.lineTo(0.105, 1.02);
  shape.lineTo(0, 0.95);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(geometry, flight);
    fin.rotation.z = (i * Math.PI) / 2 + Math.PI / 4;
    fin.castShadow = true;
    dart.add(fin);
  }
  return dart;
}

function disposeGroup(group: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(material);
        if ("map" in material && material.map instanceof THREE.Texture)
          textures.add(material.map);
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

export default function DartScene({
  target,
  clearKey,
  focused,
  onHit,
  onThrow,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const callbacks = useRef({ onHit, onThrow });
  callbacks.current = { onHit, onThrow };
  const targetRef = useRef(target);
  targetRef.current = target;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setError(true);
      return;
    }
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#171813");
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    const cameraBase = new THREE.Vector3(0.55, 0.32, 7.5);
    camera.position.copy(cameraBase);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight("#f4e6c9", "#1e1c19", 1.7));
    const light = new THREE.SpotLight("#ffd5a0", 95, 20, Math.PI / 3, 0.7, 1.6);
    light.position.set(-2, 4.5, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.001;
    light.shadow.normalBias = 0.025;
    scene.add(light, light.target);
    const fill = new THREE.PointLight("#b9c8ba", 6, 12);
    fill.position.set(4, 0, 4);
    scene.add(fill);

    const wood = makeWoodTexture();
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
    wood.repeat.set(1.5, 1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 11),
      new THREE.MeshStandardMaterial({ map: wood, roughness: 0.96 }),
    );
    wall.position.z = -0.43;
    wall.receiveShadow = true;
    scene.add(wall);

    const board = new THREE.Group();
    scene.add(board);
    const back = new THREE.Mesh(
      new THREE.CylinderGeometry(2.12, 2.12, 0.25, 128),
      new THREE.MeshStandardMaterial({ color: "#1a1b17", roughness: 0.82 }),
    );
    back.rotation.x = Math.PI / 2;
    back.position.z = -0.19;
    back.castShadow = true;
    back.receiveShadow = true;
    board.add(back);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: "#8a7960",
      roughness: 0.45,
      metalness: 0.85,
    });
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(2.035, 0.024, 12, 128),
      rimMaterial,
    );
    rim.position.z = 0.018;
    board.add(rim);
    const boardTexture = makeBoardTexture();
    // UV coverage maps the 2-unit board to its true scoring coordinates.
    boardTexture.repeat.set(950 / 1024, 950 / 1024);
    boardTexture.offset.set(37 / 1024, 37 / 1024);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(BOARD_RADIUS, 128),
      new THREE.MeshStandardMaterial({ map: boardTexture, roughness: 0.93 }),
    );
    face.receiveShadow = true;
    board.add(face);
    for (const radius of [0.065, 0.16, 0.96, 1.07, 1.59, 1.7]) {
      const wire = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.0045, 5, 128),
        rimMaterial,
      );
      wire.position.z = 0.012;
      board.add(wire);
    }
    for (let i = 0; i < 20; i++) {
      const angle = Math.PI / 2 + Math.PI / 20 + (i * Math.PI) / 10;
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 1.54, 5),
        rimMaterial,
      );
      wire.rotation.z = angle - Math.PI / 2;
      wire.position.set(Math.cos(angle) * 0.93, Math.sin(angle) * 0.93, 0.013);
      board.add(wire);
    }

    const paperGroup = new THREE.Group();
    paperGroup.position.z = 0.047;
    paperGroup.rotation.z = -0.055;
    board.add(paperGroup);
    let targetGeneration = 0;
    let disposed = false;
    let dirty = true;
    function setTarget(next: Target) {
      dirty = true;
      renderer.shadowMap.needsUpdate = true;
      const generation = ++targetGeneration;
      disposeGroup(paperGroup);
      paperGroup.clear();
      if (!next) return;
      const addPaper = (texture: THREE.Texture) => {
        if (disposed || generation !== targetGeneration) {
          texture.dispose();
          return;
        }
        dirty = true;
        renderer.shadowMap.needsUpdate = true;
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.52, 1.52),
          new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.95,
            side: THREE.DoubleSide,
          }),
        );
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        paperGroup.add(mesh);
        const tapeMaterial = new THREE.MeshStandardMaterial({
          color: "#c1b290",
          transparent: true,
          opacity: 0.73,
          roughness: 1,
          side: THREE.DoubleSide,
        });
        for (const x of [-0.56, 0.56]) {
          const tape = new THREE.Mesh(
            new THREE.PlaneGeometry(0.47, 0.18),
            tapeMaterial,
          );
          tape.position.set(x, 0.72, 0.012);
          tape.rotation.z = x > 0 ? -0.4 : 0.3;
          tape.castShadow = true;
          paperGroup.add(tape);
        }
      };
      const paintPaper = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = "#e4ddc8";
        ctx.fillRect(0, 0, 768, 768);
        for (let i = 0; i < 7000; i++) {
          ctx.fillStyle = `rgba(86,71,45,${Math.random() * 0.05})`;
          ctx.fillRect(Math.random() * 768, Math.random() * 768, 2, 2);
        }
      };
      if (next.type === "text") {
        addPaper(
          canvasTexture(768, 768, (ctx) => {
            paintPaper(ctx);
            ctx.textAlign = "center";
            let size = 104;
            let lines: string[] = [];
            while (size >= 28) {
              ctx.font = `600 ${size}px "Barlow Condensed", sans-serif`;
              lines = [];
              for (const paragraph of next.text.toUpperCase().split("\n")) {
                let line = "";
                for (const word of paragraph.split(" ")) {
                  if (ctx.measureText(word).width > 620) {
                    if (line) {
                      lines.push(line);
                      line = "";
                    }
                    for (const character of word) {
                      if (ctx.measureText(line + character).width > 620) {
                        lines.push(line);
                        line = "";
                      }
                      line += character;
                    }
                  } else if (
                    ctx.measureText(line ? `${line} ${word}` : word).width > 620
                  ) {
                    lines.push(line);
                    line = word;
                  } else line = line ? `${line} ${word}` : word;
                }
                lines.push(line);
              }
              if (lines.length * size * 1.1 <= 540) break;
              size -= 4;
            }
            ctx.fillStyle = "#34352d";
            ctx.textBaseline = "middle";
            lines.forEach((line, i) =>
              ctx.fillText(
                line,
                384,
                384 + (i - (lines.length - 1) / 2) * size * 1.1,
              ),
            );
          }),
        );
      } else {
        const image = new Image();
        image.onload = () => {
          if (disposed || generation !== targetGeneration) return;
          addPaper(
            canvasTexture(768, 768, (ctx) => {
              paintPaper(ctx);
              const scale = Math.max(688 / image.width, 688 / image.height);
              ctx.save();
              ctx.beginPath();
              ctx.rect(40, 40, 688, 688);
              ctx.clip();
              ctx.drawImage(
                image,
                384 - (image.width * scale) / 2,
                384 - (image.height * scale) / 2,
                image.width * scale,
                image.height * scale,
              );
              ctx.restore();
            }),
          );
        };
        image.src = next.url;
      }
    }
    setTarget(targetRef.current);

    const darts = new THREE.Group();
    scene.add(darts);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const impactPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.09);
    let flying: {
      dart: THREE.Group;
      start: THREE.Vector3;
      end: THREE.Vector3;
      time: number;
      hit: Hit;
    } | null = null;
    let lastImpact = -1000;
    const aim = new THREE.Vector2();
    let keyboardX = 0;
    let keyboardY = 0;
    const crosshair = new THREE.Group();
    const crossMaterial = new THREE.MeshBasicMaterial({
      color: "#edd5b0",
      transparent: true,
      opacity: 0.8,
      depthTest: false,
    });
    const crossRing = new THREE.Mesh(
      new THREE.RingGeometry(0.067, 0.071, 32),
      crossMaterial,
    );
    crosshair.add(crossRing);
    for (let i = 0; i < 4; i++) {
      const tick = new THREE.Mesh(
        new THREE.PlaneGeometry(0.003, 0.05),
        crossMaterial,
      );
      tick.rotation.z = (i * Math.PI) / 2;
      tick.position.set(
        Math.sin((i * Math.PI) / 2) * 0.094,
        Math.cos((i * Math.PI) / 2) * 0.094,
        0,
      );
      crosshair.add(tick);
    }
    crosshair.position.z = 0.15;
    crosshair.visible = false;
    crosshair.renderOrder = 10;
    scene.add(crosshair);

    function throwAt(x: number, y: number) {
      if (flying) return;
      const hit = scoreHit(x, y);
      const dart = makeDart();
      const end = new THREE.Vector3(
        x,
        y,
        Math.hypot(x, y) <= 2.1 ? 0.09 : -0.41,
      );
      const start = new THREE.Vector3(1.5, -2.5, 7);
      dart.position.copy(start);
      dart.rotation.set(-0.11, -0.14, 0);
      darts.add(dart);
      flying = { dart, start, end, time: performance.now(), hit };
      crosshair.visible = false;
      callbacks.current.onThrow();
    }
    function pointAt(event: MouseEvent) {
      const rect = container.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const point = new THREE.Vector3();
      return raycaster.ray.intersectPlane(impactPlane, point);
    }
    function handleMove(event: PointerEvent) {
      const point = pointAt(event);
      if (!point || event.pointerType === "touch") return;
      aim.set(pointer.x, pointer.y);
      crosshair.position.set(point.x, point.y, 0.15);
      crosshair.visible = !flying;
      dirty = true;
    }
    function handleClick(event: MouseEvent) {
      if (event.button !== 0) return;
      const point = pointAt(event);
      if (point) throwAt(point.x, point.y);
    }
    function handleLeave() {
      crosshair.visible = false;
      aim.set(0, 0);
      dirty = true;
    }
    function handleKey(event: KeyboardEvent) {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          " ",
          "Enter",
        ].includes(event.key)
      )
        return;
      event.preventDefault();
      if (event.key === "ArrowLeft") keyboardX -= 0.1;
      if (event.key === "ArrowRight") keyboardX += 0.1;
      if (event.key === "ArrowUp") keyboardY += 0.1;
      if (event.key === "ArrowDown") keyboardY -= 0.1;
      keyboardX = THREE.MathUtils.clamp(keyboardX, -2.4, 2.4);
      keyboardY = THREE.MathUtils.clamp(keyboardY, -2.4, 2.4);
      crosshair.position.set(keyboardX, keyboardY, 0.15);
      crosshair.visible = !flying;
      dirty = true;
      if ((event.key === " " || event.key === "Enter") && !event.repeat)
        throwAt(keyboardX, keyboardY);
    }
    container.addEventListener("pointermove", handleMove);
    container.addEventListener("click", handleClick);
    container.addEventListener("pointerleave", handleLeave);
    container.addEventListener("keydown", handleKey);
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      cameraBase.z = camera.aspect < 1 ? 7 / camera.aspect : 7.5;
      camera.position.copy(cameraBase);
      camera.lookAt(0, -0.04, 0);
      camera.updateProjectionMatrix();
      dirty = true;
      renderer.render(scene, camera);
    });
    resize.observe(container);
    const clear = () => {
      flying = null;
      disposeGroup(darts);
      darts.clear();
      lastImpact = -1000;
      keyboardX = keyboardY = 0;
      crosshair.visible = false;
      dirty = true;
      renderer.shadowMap.needsUpdate = true;
    };
    controller.current = { setTarget, clear };
    const cameraTarget = new THREE.Vector3();
    renderer.setAnimationLoop((time) => {
      if (document.hidden) return;
      cameraTarget.set(
        cameraBase.x + (reducedMotion ? 0 : aim.x * 0.07),
        cameraBase.y + (reducedMotion ? 0 : aim.y * 0.04),
        cameraBase.z,
      );
      // Keep an idle board cheap, especially on phones and integrated graphics.
      if (
        !dirty &&
        !flying &&
        time - lastImpact > 250 &&
        camera.position.distanceToSquared(cameraTarget) < 0.000001
      )
        return;
      dirty = false;
      camera.position.lerp(cameraTarget, 0.15);
      if (!reducedMotion && time - lastImpact < 220)
        camera.position.x +=
          Math.sin((time - lastImpact) * 0.12) *
          0.008 *
          (1 - (time - lastImpact) / 220);
      camera.lookAt(0, -0.04, 0);
      if (flying) {
        renderer.shadowMap.needsUpdate = true;
        const progress = Math.min(
          (performance.now() - flying.time) / (reducedMotion ? 130 : 360),
          1,
        );
        flying.dart.position.lerpVectors(flying.start, flying.end, progress);
        if (!reducedMotion)
          flying.dart.position.y += Math.sin(progress * Math.PI) * 0.6;
        if (progress === 1) {
          const { hit } = flying;
          flying = null;
          lastImpact = time;
          callbacks.current.onHit(hit);
          if (darts.children.length > 30) {
            const old = darts.children[0];
            darts.remove(old);
            disposeGroup(old);
          }
        }
      }
      renderer.render(scene, camera);
    });
    setReady(true);
    return () => {
      disposed = true;
      controller.current = null;
      resize.disconnect();
      container.removeEventListener("pointermove", handleMove);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("pointerleave", handleLeave);
      container.removeEventListener("keydown", handleKey);
      renderer.setAnimationLoop(null);
      disposeGroup(scene);
      light.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    controller.current?.setTarget(target);
  }, [target]);
  useEffect(() => {
    controller.current?.clear();
  }, [clearKey]);
  useEffect(() => {
    if (focused) containerRef.current?.focus();
  }, [focused]);

  return (
    <div className="scene-wrap">
      <div
        ref={containerRef}
        className="dart-scene"
        role="application"
        tabIndex={0}
        aria-label="Interactive 3D dartboard. Click or tap to throw. Keyboard: arrow keys to aim, Enter or Space to throw."
      />
      {!ready && !error && (
        <div className="scene-loading">
          <LoaderCircle className="spin" size={24} />
          <span>Loading…</span>
        </div>
      )}
      {error && (
        <div className="scene-loading">
          <Crosshair size={28} />
          <strong>The board couldn’t load.</strong>
          <span>
            Enable hardware acceleration in your browser to play in 3D.
          </span>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      )}
      <div className="scene-vignette" />
    </div>
  );
}
