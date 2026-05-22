/* FlowerVision 3D Hibiscus Bloom — Three.js r128 */

(function () {
  'use strict';

  const rootEl = document.getElementById('flower3d-screen');
  const canvas = document.getElementById('flower3d-canvas');

  // Wait for THREE to be available
  function boot() {
    if (typeof THREE === 'undefined') { setTimeout(boot, 50); return; }
    init();
  }

  // Scene globals
  let renderer, scene, camera, clock;
  let flowerGroup;
  let petalMeshes = [];
  let bloomT = 0;            // 0→1
  const BLOOM_DUR  = 3.4;   // seconds to fully open
  const HOLD_DUR   = 1.0;   // seconds held open before firing done
  let phase = 'bloom';      // 'bloom' | 'hold'
  let holdTimer = 0;
  let doneFired = false;

  // Smooth easing
  function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Build one hibiscus petal
  function buildPetal(color, petalLength, petalWidth) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(
      -petalWidth * 0.8,  petalLength * 0.15,
      -petalWidth,        petalLength * 0.55,
       0,                 petalLength
    );
    shape.bezierCurveTo(
       petalWidth,        petalLength * 0.55,
       petalWidth * 0.8,  petalLength * 0.15,
       0,                 0
    );

    const extSettings = {
      depth: petalLength * 0.04,
      bevelEnabled: true,
      bevelThickness: petalLength * 0.015,
      bevelSize: petalLength * 0.015,
      bevelSegments: 6,
      steps: 3,
      curveSegments: 24,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extSettings);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = y / petalLength;        // 0 at base, 1 at tip
      const curl = t * t * petalLength * 0.18;
      pos.setZ(i, pos.getZ(i) + curl);
      const x = pos.getX(i);
      pos.setX(i, x * (1 - t * 0.15));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      color,
      emissive     : new THREE.Color(color).multiplyScalar(0.06),
      roughness    : 0.30,
      metalness    : 0.00,
      clearcoat    : 0.55,
      clearcoatRoughness: 0.20,
      side         : THREE.DoubleSide,
      transparent  : true,
      opacity      : 1.0,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.geometry.translate(0, 0, -extSettings.depth * 0.5);
    return mesh;
  }

  // Build the full hibiscus flower
  function buildFlower() {
    const group = new THREE.Group();

    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -5.5, 0),
      new THREE.Vector3(0.15, -3.5, 0.1),
      new THREE.Vector3(-0.1, -1.8, 0),
      new THREE.Vector3(0,  0,  0),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 20, 0.09, 10, false);
    const stemMat = new THREE.MeshPhysicalMaterial({
      color    : new THREE.Color(0x3a8c48),
      roughness: 0.70,
      metalness: 0.0,
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.castShadow = true;
    group.add(stem);

    const leafConfigs = [
      { ax: 0.6,  ay: -2.2, az: 0,    rx: -0.3, ry:  0.5, rz:  0.9,  sx: 0.8, sy: 1.0 },
      { ax: -0.55, ay: -3.2, az: 0,   rx: -0.2, ry: -0.6, rz: -0.85, sx: 0.7, sy: 0.85},
    ];
    leafConfigs.forEach(cfg => {
      const lsh = new THREE.Shape();
      lsh.moveTo(0, 0);
      lsh.bezierCurveTo(-0.5, 0.4,  -0.55, 1.3, 0, 1.9);
      lsh.bezierCurveTo( 0.55, 1.3,   0.5, 0.4, 0, 0);
      const lGeo = new THREE.ExtrudeGeometry(lsh, { depth: 0.03, bevelEnabled: false, curveSegments: 16 });
      const lMat = new THREE.MeshPhysicalMaterial({
        color    : new THREE.Color(0x2e7d42),
        roughness: 0.65,
        side     : THREE.DoubleSide,
      });
      const leaf = new THREE.Mesh(lGeo, lMat);
      leaf.position.set(cfg.ax, cfg.ay, cfg.az);
      leaf.rotation.set(cfg.rx, cfg.ry, cfg.rz);
      leaf.scale.set(cfg.sx, cfg.sy, 1);
      leaf.castShadow = true;
      group.add(leaf);
    });

    const PETAL_COUNT = 5;
    const petalLength = 2.8;
    const petalWidth  = 1.05;
    const petalColors = [
      0xff3355,
      0xff2244,
      0xff4466,
      0xff3355,
      0xff2040,
    ];

    petalMeshes = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      const angleY = (i / PETAL_COUNT) * Math.PI * 2;
      const col = new THREE.Color(petalColors[i]);
      const petal = buildPetal(col, petalLength, petalWidth);
      petal.userData.angleY = angleY;
      petal.userData.idx    = i;

      const pivot = new THREE.Group();
      pivot.add(petal);
      pivot.rotation.y = angleY;
      petal.rotation.x = -Math.PI / 2 + 0.1;
      pivot.userData.petalMesh = petal;
      pivot.userData.idx = i;

      group.add(pivot);
      petalMeshes.push(pivot);
    }

    const sepalCount = 5;
    for (let i = 0; i < sepalCount; i++) {
      const angleY = (i / sepalCount) * Math.PI * 2 + Math.PI / sepalCount;
      const sSh = new THREE.Shape();
      sSh.moveTo(0, 0);
      sSh.bezierCurveTo(-0.12, 0.2, -0.1, 0.6, 0, 0.75);
      sSh.bezierCurveTo( 0.1,  0.6,  0.12, 0.2, 0, 0);
      const sGeo = new THREE.ExtrudeGeometry(sSh, { depth: 0.02, bevelEnabled: false, curveSegments: 10 });
      const sMat = new THREE.MeshPhysicalMaterial({ color: 0x2e7030, roughness: 0.6, side: THREE.DoubleSide });
      const sepal = new THREE.Mesh(sGeo, sMat);
      const sepPivot = new THREE.Group();
      sepPivot.add(sepal);
      sepal.rotation.x = -Math.PI / 2 + 0.6;
      sepPivot.rotation.y = angleY;
      group.add(sepPivot);
    }

    const stTubeGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.6, 16);
    const stTubeMat = new THREE.MeshPhysicalMaterial({ color: 0xdc1a3c, roughness: 0.4 });
    const stTube = new THREE.Mesh(stTubeGeo, stTubeMat);
    stTube.position.y = 0.5;
    group.add(stTube);

    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const r   = 0.18 + (i % 3) * 0.06;
      const h   = 1.3 + (i % 2) * 0.1;
      const aGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const aMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
      const anther = new THREE.Mesh(aGeo, aMat);
      anther.position.set(Math.cos(ang) * r, h, Math.sin(ang) * r);
      group.add(anther);
    }

    const discGeo = new THREE.SphereGeometry(0.2, 20, 20);
    const discMat = new THREE.MeshPhysicalMaterial({ color: 0xb01030, roughness: 0.5 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.08;
    group.add(disc);

    return group;
  }

  // Particle system
  let particleSys;

  function buildParticles() {
    const N   = 320;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const vel = [];
    const age = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      spawnParticle(pos, vel, age, i, true);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color      : 0xff80b0,
      size       : 0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity    : 0.8,
      blending   : THREE.AdditiveBlending,
      depthWrite : false,
    });

    const pts = new THREE.Points(geo, mat);
    pts.userData.vel = vel;
    pts.userData.age = age;
    pts.userData.N   = N;
    return pts;
  }

  function spawnParticle(pos, vel, age, i, random) {
    const ang = Math.random() * Math.PI * 2;
    const r   = Math.random() * 2.0;
    pos[i*3]   = Math.cos(ang) * r;
    pos[i*3+1] = random ? (Math.random() * 5 - 1) : -0.3;
    pos[i*3+2] = Math.sin(ang) * r;
    vel[i*3]   = (Math.random() - 0.5) * 0.5;
    vel[i*3+1] = 0.5 + Math.random() * 1.2;
    vel[i*3+2] = (Math.random() - 0.5) * 0.5;
    age[i]     = random ? Math.random() : 0;
  }

  function tickParticles(dt) {
    const pos = particleSys.geometry.attributes.position.array;
    const vel = particleSys.userData.vel;
    const age = particleSys.userData.age;
    const N   = particleSys.userData.N;
    for (let i = 0; i < N; i++) {
      age[i] += dt * 0.22;
      if (age[i] > 1) { spawnParticle(pos, vel, age, i, false); continue; }
      pos[i*3]   += vel[i*3]   * dt;
      pos[i*3+1] += vel[i*3+1] * dt;
      pos[i*3+2] += vel[i*3+2] * dt;
      vel[i*3+1] -= 0.12 * dt;
    }
    particleSys.geometry.attributes.position.needsUpdate = true;
    particleSys.material.opacity = 0.35 + bloomT * 0.65;
  }

  // Update bloom: open petals from vertical to horizontal
  function applyBloom(t) {
    const ease = easeInOutCubic(Math.min(t, 1));
    const closedX = -Math.PI / 2 + 0.15;
    const openX   =  Math.PI / 2 - 0.22;

    petalMeshes.forEach((pivot, i) => {
      const petal = pivot.userData.petalMesh;
      const offset = i * 0.06;
      const localT = Math.max(0, Math.min((t - offset) / (1 - offset * 0.3), 1));
      const localEase = easeInOutCubic(localT);
      petal.rotation.x = THREE.MathUtils.lerp(closedX, openX, localEase);
    });
  }

  // Gradient background
  let bgScene, bgCam;
  function initBackground() {
    bgScene = new THREE.Scene();
    bgCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uA: { value: new THREE.Color(0x0b0617) },
        uB: { value: new THREE.Color(0x1a0828) },
        uC: { value: new THREE.Color(0x0d0014) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform vec3 uA, uB, uC;
        varying vec2 vUv;
        void main(){
          float r = length(vUv - vec2(0.5));
          vec3 col = mix(uA, uC, smoothstep(0.0, 0.7, r));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false,
    });
    bgScene.add(new THREE.Mesh(geo, mat));
  }

  // Lighting
  function setupLights() {
    scene.add(new THREE.AmbientLight(0xfff0f8, 0.55));

    const key = new THREE.DirectionalLight(0xfff5ee, 1.6);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xd0c0ff, 0.55);
    fill.position.set(-5, 2, -3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xff8898, 0.45);
    rim.position.set(0, -2, 4);
    scene.add(rim);

    const inner = new THREE.PointLight(0xff3050, 2.0, 5);
    inner.position.set(0, 0.8, 0);
    scene.add(inner);
  }

  // Init
  function init() {
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace   = THREE.SRGBColorSpace;
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.2, 9.5);
    camera.lookAt(0, 0.8, 0);

    initBackground();
    setupLights();

    flowerGroup = buildFlower();
    flowerGroup.position.y = -0.5;
    scene.add(flowerGroup);

    particleSys = buildParticles();
    scene.add(particleSys);

    applyBloom(0);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    requestAnimationFrame(loop);
  }

  // Animation loop
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);

    renderer.autoClear = false;
    renderer.clear();
    renderer.render(bgScene, bgCam);

    if (phase === 'bloom') {
      bloomT = Math.min(bloomT + dt / BLOOM_DUR, 1);
      applyBloom(bloomT);
      if (bloomT >= 1) phase = 'hold';
    } else if (phase === 'hold') {
      holdTimer += dt;
      if (holdTimer >= HOLD_DUR && !doneFired) {
        doneFired = true;
        rootEl.dispatchEvent(new CustomEvent('flower3d:done'));
      }
    }

    // Gentle slow rotation
    flowerGroup.rotation.y += dt * 0.18;

    const targetZ = 9.5 - bloomT * 2.8;
    camera.position.z += (targetZ - camera.position.z) * 0.025;

    tickParticles(dt);

    renderer.render(scene, camera);
  }

  boot();

})();
