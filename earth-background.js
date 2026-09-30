(() => {
  const canvas = document.getElementById('earth-bg');
  const ctx = canvas.getContext('2d');
  const RAD = Math.PI / 180;
  const TAU = Math.PI * 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 時刻(テスト用: ?speed=3600 で早送り、?time=2026-09-29T18:00 で時刻指定) ---------- */
  const params = new URLSearchParams(location.search);
  const speed = Number(params.get('speed')) || 1;
  const fixed = params.get('time') ? Date.parse(params.get('time')) : NaN;
  const t0 = performance.now();
  const nowMs = () => {
    const el = performance.now() - t0;
    return isNaN(fixed) ? Date.now() + el * (speed - 1) : fixed + el * speed;
  };

  /* ---------- 大陸のごく簡略なポリゴン [経度, 緯度] ---------- */
  const LAND = [
    // 北アメリカ
    [[-168,66],[-164,70],[-156,71.5],[-141,70],[-125,70],[-110,68],[-95,68],[-90,69],[-82,69],[-82,63],[-93,60],[-94,57],[-88,56],[-82,53],[-79,51],[-79,55],[-77,60],[-70,60],[-65,58],[-61,56],[-56,52],[-60,48],[-65,49],[-64,45.5],[-70,43.5],[-70,41.5],[-74,40.5],[-76,37],[-76,35],[-81,31],[-80,26],[-82,26],[-84,30],[-89,30],[-94,29.5],[-97,26],[-97.5,22],[-96,19],[-91,18.5],[-90,21],[-87,21],[-88,16],[-84,15.5],[-83,11],[-79.5,9.5],[-77.5,8.5],[-78,7],[-80,7.5],[-83,8.5],[-85.5,10.5],[-87.5,13],[-91,14],[-94,16],[-98,16],[-105.5,19.5],[-108,25],[-113,31],[-115,30],[-117,32.5],[-120.5,34.5],[-124,40],[-124,46],[-123,49],[-128,51],[-133,55],[-138,59],[-146,60.5],[-152,59],[-158,57],[-164,55],[-158,58.5],[-162,60],[-166,62],[-165,64]],
    // グリーンランド
    [[-73,78],[-60,82],[-30,83],[-18,80],[-20,72],[-22,70],[-32,68],[-42,60],[-48,61],[-53,66],[-56,72],[-68,76]],
    // バフィン島
    [[-80,63.5],[-72,68],[-62,67],[-65,62.5],[-72,63]],
    // キューバ
    [[-85,22],[-80,23.2],[-74,20],[-77.5,20],[-82,22.5]],
    // 南アメリカ
    [[-77.5,8.5],[-72,12],[-63,10.5],[-60,8],[-52,5],[-50,0],[-44,-2.5],[-35,-5.5],[-35,-9],[-39,-14],[-39,-18],[-41,-22],[-48,-25.5],[-49,-29],[-53,-34],[-57,-35],[-57,-38],[-62,-39],[-65,-41],[-65,-45],[-67,-46],[-66,-48],[-69,-51],[-68.5,-53],[-71,-54],[-74,-51],[-75,-47],[-73.5,-40],[-72,-33],[-71.5,-28],[-70,-18],[-76,-14],[-81,-6],[-80.5,-2],[-80,0.5],[-78.5,2],[-77.5,7]],
    // ユーラシア
    [[-9,37],[-9,43],[-2,43.5],[-1.5,46],[-4.5,48.5],[-1.5,49.5],[2,51],[5,53],[8.5,54],[8.5,57],[10.5,57.5],[10.5,55],[12,54],[14,54],[19,54.5],[21,57],[24,57.5],[24,59.5],[29,60],[22,60.5],[21.5,63],[25,65],[21.5,65.7],[17.5,62.5],[19,60],[16.5,57],[13,55.5],[11,58.5],[8,58],[5,59],[5,62],[12,66],[16,69],[24,71],[31,70],[41,67],[44,68],[54,68.5],[60,69],[68,68.5],[72,72.5],[80,73],[87,75],[100,77],[112,74],[130,71],[140,72.5],[150,71],[160,69.5],[170,70],[180,69],[180,65],[178,62.5],[170,60],[163,59.5],[160,54],[156,51],[156,57],[152,59],[143,59],[137,54],[141,53],[141,48],[135,43],[130,42.5],[129.5,40],[127.5,39.5],[129,35.5],[126.5,34.5],[126,37.5],[125,39.5],[121.5,39],[122,40.5],[118,39],[119,37],[122.5,37],[120.5,36],[119,34.5],[121.5,31.5],[122,29.5],[120,26],[116,23],[110,21],[108,21.5],[106,19],[109,15],[109,11.5],[105,8.7],[103,10.5],[100.5,13.5],[99,10],[100.5,6.5],[103.5,1.5],[101,3],[98,8],[98,14],[94.5,16.5],[94,19],[91.5,22.5],[87,21.5],[80.5,15.5],[80,10],[77.5,8],[76,10],[73,17],[72.5,21],[70,21],[67,24.5],[62,25],[57,25.5],[56.5,27],[52,27.5],[50,30],[48.5,30],[50.5,26],[51.5,24],[56,26],[56.5,24],[59.5,22.5],[58,20],[55,17],[52,16],[47,13.5],[43.5,13],[42.5,16],[39,21.5],[35,28],[35,29],[34.5,31.5],[35.5,34],[36,36.5],[32,36.2],[28,36.7],[26.5,38.5],[26.5,40],[29,41],[31,41.2],[35,42],[38,41],[41.5,41.5],[41.5,42.5],[38,44.5],[37,45.5],[35,45],[33,44.5],[32,46.5],[30,45.5],[28.5,43.5],[28,41.5],[26,40.8],[23.5,40],[24,38],[23,36.5],[21.5,37],[19.5,40],[19,42],[13.5,45.5],[12.5,44],[16,41.5],[18.5,40],[16,38],[15.7,40],[12.5,41.5],[10,44],[8,44],[3,43],[3,42],[0,39.5],[-0.5,38.5],[-2,36.7],[-5.5,36]],
    [[-180,69],[-175,67.5],[-170,66],[-172,64.5],[-180,65]],
    // アフリカ
    [[-5.5,36],[-2,35.2],[10,37.2],[11,33.5],[15,32.3],[20,32.7],[20,30.5],[25,31.7],[32,31.3],[32.5,30],[33,27.5],[35.5,24],[37.5,18.5],[39,15.5],[43,12.5],[43,11.5],[51,12],[51,10.5],[48,5],[44,1],[41,-2],[39,-5],[39.5,-8],[40.5,-11],[40.5,-15],[35,-20],[35.5,-24],[32.5,-26],[32,-29],[28,-33],[25,-34],[20,-34.8],[18,-32],[15,-27],[14,-22],[11.5,-17],[13.5,-12],[12,-6],[9,-1],[9.5,4],[6,4.3],[4,6.3],[-2,5],[-7.5,4.4],[-12,7.5],[-15,11],[-17,14.7],[-16.5,19],[-16,23],[-13,27.5],[-10,29.5],[-9.5,32],[-6.5,34]],
    // マダガスカル
    [[44,-25],[47,-25],[50,-15.5],[49.5,-12.5],[47.5,-14.5],[44,-17],[43.5,-22]],
    // オーストラリア
    [[114,-22],[114,-26],[115,-34],[118,-35],[123.5,-34],[131,-31.5],[135.5,-35],[138,-35.5],[140,-38],[146,-39],[150,-37.5],[153,-31],[153,-25.5],[149,-21],[146,-19],[145,-15],[143.5,-11],[142,-11],[141.5,-16],[139.5,-17.5],[136,-15],[137,-12],[132.5,-11.5],[130,-13],[126,-14],[122,-17.5]],
    // 日本(本州・北海道・九州・四国)
    [[130.9,34],[132,35.5],[135.5,35.7],[137,37],[139,38],[140,40.5],[141.5,41.4],[142,39.5],[141,36],[140,35],[137,34.6],[135,33.5],[133,34.2]],
    [[140,42],[141,45.4],[145.5,43.5],[143,42],[141,42.5]],
    [[129.8,33.5],[131.5,33.7],[131.5,31.4],[130.5,31],[129.7,32.5]],
    [[132.5,33.8],[134.6,34.2],[134.2,33.2],[133,32.8]],
    // サハリン・台湾・フィリピン
    [[142,46],[143.5,49],[143,53.8],[142,53],[142,49]],
    [[120.2,23],[121.5,25],[122,24.5],[120.8,22]],
    [[120,18.5],[122,18.3],[122,16],[124,13],[121,13.8],[120,15]],
    [[122,7],[126,9],[126,6.5],[124.5,6.3]],
    // イギリス・アイルランド・アイスランド
    [[-5.5,50],[1.5,51],[1.8,53],[-1.5,55.5],[-2,57.5],[-3.5,58.6],[-5.5,58.5],[-6,56.5],[-5,55],[-3,54.5],[-3,53.4],[-4.5,53],[-4.5,52],[-5.3,51.7],[-3,51.3],[-5,50.5]],
    [[-10,51.7],[-6,52],[-6,54.5],[-8,55.2],[-10,54],[-9.5,52.5]],
    [[-24,65.5],[-22,66.4],[-14,66.4],[-13.5,65],[-18,63.5],[-22.5,63.8]],
    // インドネシア・ニューギニア・ニュージーランド
    [[95.3,5.5],[98,4],[104,-1.5],[106,-3],[105.5,-5.8],[102,-4],[99,0.5],[96,3]],
    [[109,1.5],[111,2],[114.5,4.5],[117.5,7],[119,5],[117.5,1],[116.5,-3.5],[114,-4],[111,-3],[110,-1.5]],
    [[105.5,-6.5],[108,-6.5],[114.5,-7.7],[114.5,-8.7],[108,-7.8],[105.5,-6.9]],
    [[131,-1],[135,-3.3],[141,-2.6],[147,-6],[150.5,-10.5],[143,-9],[138,-8.2],[137,-5],[132.5,-4]],
    [[173,-35],[175,-37],[178,-38],[175,-41.5],[174.5,-39.5]],
    [[172.5,-40.5],[174,-41.5],[171,-44.5],[169,-46.5],[166.5,-46],[168,-44]]
  ];
  const BOX = LAND.map(p => {
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const [x, y] of p) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }
    return [a, b, c, d];
  });
  function isLand(lon, lat) {
    if (lat < -72) return true; // 南極
    for (let k = 0; k < LAND.length; k++) {
      const bb = BOX[k];
      if (lon < bb[0] || lon > bb[1] || lat < bb[2] || lat > bb[3]) continue;
      const poly = LAND[k];
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) c = !c;
      }
      if (c) return true;
    }
    return false;
  }

  /* ---------- 球面上の点(フィボナッチ格子) ---------- */
  const N = 9000;
  const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
  const land = new Uint8Array(N);
  const jx = new Float32Array(N), jy = new Float32Array(N), ph = new Float32Array(N);
  const dr = new Float32Array(N), spn = new Float32Array(N); // 弾ける距離 / 渦の向きと強さ
  const dl = new Float32Array(N), ot = new Float32Array(N), bk = new Float32Array(N); // 点ごとの開始遅れ / 弾ける時間 / 戻る時間
  const kx = new Float32Array(N), ky = new Float32Array(N), wb = new Float32Array(N); // 勝手な方向への飛び / ぶれ
  const GOLD = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + .5) / N;
    const lat = Math.asin(y);
    let lon = (i * GOLD) % TAU; if (lon > Math.PI) lon -= TAU;
    px[i] = Math.cos(lat) * Math.sin(lon);
    py[i] = y;
    pz[i] = Math.cos(lat) * Math.cos(lon);
    land[i] = isLand(lon / RAD, lat / RAD) ? 1 : 0;
    jx[i] = Math.random() * 2 - 1; jy[i] = Math.random() * 2 - 1; ph[i] = Math.random() * TAU;
    const r1 = Math.random();
    dr[i] = .15 + r1 * r1 * 2.2;                                  // 少数の点だけ遠くまで飛ぶ
    spn[i] = (Math.random() < .5 ? -1 : 1) * (.3 + Math.random() * .7); // 右回り・左回りがバラバラ
    dl[i] = Math.random() * 700; ot[i] = 500 + Math.random() * 900; bk[i] = 1800 + Math.random() * 1800;
    kx[i] = (Math.random() * 2 - 1) * .7; ky[i] = (Math.random() * 2 - 1) * .7; wb[i] = .5 + Math.random() * 2;
  }

  /* ---------- 色(昼側は暖色、夜側は寒色。明暗の境目はなめらか) ---------- */
  const B = 24, landS = [], seaS = [];
  const mix = (a, b, t) => a + (b - a) * t;
  for (let k = 0; k < B; k++) {
    const t = k / (B - 1);
    landS.push(`rgba(${mix(120,255,t)|0},${mix(150,224,t)|0},${mix(235,165,t)|0},${mix(.30,.62,t).toFixed(3)})`);
    seaS.push(`rgba(${mix(110,150,t)|0},${mix(140,190,t)|0},${mix(220,255,t)|0},${mix(.05,.15,t).toFixed(3)})`);
  }

  /* ---------- 太陽の位置(直下点の緯度・経度) ---------- */
  function sunPoint(ms) {
    const d = ms / 86400000 + 2440587.5 - 2451545.0;
    const g = (357.529 + 0.98560028 * d) * RAD;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
    const e = (23.439 - 0.00000036 * d) * RAD;
    const lat = Math.asin(Math.sin(e) * Math.sin(L));
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    const gmst = ((280.46061837 + 360.98564736629 * d) % 360) * RAD;
    const lon = Math.atan2(Math.sin(ra - gmst), Math.cos(ra - gmst));
    return { lat, lon };
  }

  /* ---------- 現在地 ---------- */
  // 取得できるまではタイムゾーンから経度だけ推定し、取得できたらそこへ回転する
  const view = { lat: 25 * RAD, lon: -new Date().getTimezoneOffset() / 4 * RAD };
  const loc = { lat: view.lat, lon: view.lon };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => { loc.lat = p.coords.latitude * RAD; loc.lon = p.coords.longitude * RAD; dirty = true; },
      () => {}, { maximumAge: 3600000, timeout: 10000 }
    );
  }

  /* ---------- 振動(ばね + 揺らぎ) ---------- */
  let ox = 0, oy = 0, vx = 0, vy = 0, energy = 0, shakeS = 0;
  let inX = 0, inY = 0, shakeIn = 0, lastEvt = -1e9;
  const K = 120, C = 5, A = 90; // ばね定数 / 減衰 / 加速度の効き

  function kick(dx, dy) {
    if (reduce) return;
    vx += dx; vy += dy;
    const s = Math.hypot(vx, vy);
    if (s > 900) { vx *= 900 / s; vy *= 900 / s; }
  }
  function step(dt) {
    const age = performance.now() - lastEvt;
    const fx = age < 150 ? inX : 0, fy = age < 150 ? inY : 0;
    vx += (-K * ox - C * vx + A * fx) * dt;
    vy += (-K * oy - C * vy + A * fy) * dt;
    ox += vx * dt; oy += vy * dt;
    if (Math.abs(ox) + Math.abs(oy) + Math.abs(vx) + Math.abs(vy) < .02) { ox = oy = vx = vy = 0; }
    shakeS += ((age < 150 ? shakeIn : 0) - shakeS) * Math.min(1, dt * 8);
    energy = Math.min(1, (Math.hypot(ox, oy) + Math.hypot(vx, vy) * .05) / 20);
  }

  // 端末の動き(スマホ・タブレット)
  const grav = { x: 0, y: 0, z: 0 };
  function onMotion(e) {
    let ax, ay, az, a = e.acceleration;
    if (a && a.x != null) { ax = a.x; ay = a.y; az = a.z; }
    else {
      a = e.accelerationIncludingGravity;
      if (!a || a.x == null) return;
      grav.x += (a.x - grav.x) * .1; grav.y += (a.y - grav.y) * .1; grav.z += (a.z - grav.z) * .1;
      ax = a.x - grav.x; ay = a.y - grav.y; az = a.z - grav.z;
    }
    inX = ax; inY = -ay; // 画面の下方向が +y
    shakeIn = Math.hypot(ax, ay, az);
    lastEvt = performance.now();
  }
  if (!reduce) {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS は読み込み時に許可を試みる。許可ダイアログはユーザー操作中のみ表示される。
      DeviceMotionEvent.requestPermission().then(permission => {
        if (permission === 'granted') addEventListener('devicemotion', onMotion);
      }).catch(() => {});
    } else if ('DeviceMotionEvent' in window) {
      addEventListener('devicemotion', onMotion);
    }
  }
  // PC向けの代替: ブラウザウィンドウを動かす / マウスを動かす
  let lsx = screenX, lsy = screenY, lpx = null, lpy = null;
  addEventListener('pointermove', e => {
    if (lpx !== null) kick((e.clientX - lpx) * 1.5, (e.clientY - lpy) * 1.5);
    lpx = e.clientX; lpy = e.clientY;
  }, { passive: true });

  /* ---------- 弾けて渦を巻いて戻る演出 ---------- */
  // first: 最初に弾けるまで / cycle: 繰り返し間隔 / hold: 渦巻き (ms)。弾ける・戻る時間と開始遅れは点ごとにバラバラ
  const BURST = { first: 4000, cycle: 15000, hold: 1800 };
  const BURST_D = 700 + 1400 + BURST.hold + 3600;
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function burstState(t) {
    if (reduce || t < BURST.first) return { on: false, p: 0 };
    const p = (t - BURST.first) % BURST.cycle;
    return p > BURST_D ? { on: false, p: 0 } : { on: true, p };
  }

  /* ---------- 描画 ---------- */
  let W, H, dpr, dirty = true;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }
  addEventListener('resize', resize);
  resize();

  function drawSun(x, y, R, front) {
    const glow = R * .34, a = front ? 1 : .75;
    const g = ctx.createRadialGradient(x, y, 0, x, y, glow);
    g.addColorStop(0, `rgba(255,207,122,${.85 * a})`);
    g.addColorStop(.25, `rgba(255,190,100,${.35 * a})`);
    g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, glow, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,232,180,${.9 * a})`;
    ctx.beginPath(); ctx.arc(x, y, R * .04, 0, TAU); ctx.fill();
  }

  function draw(t) {
    const R = Math.min(W, H) * .44;
    const cx = W / 2 + ox, cy = H / 2 + oy;
    const cl = Math.cos(view.lon), sl = Math.sin(view.lon);
    const cp = Math.cos(view.lat), sp = Math.sin(view.lat);
    const rot = (lat, lon) => {
      const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
      const x1 = x * cl - z * sl, z1 = x * sl + z * cl;
      return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
    };

    // 太陽(時刻)
    const sun = sunPoint(nowMs());
    const [sx, sy, sz] = rot(sun.lat, sun.lon);
    const orbit = Math.min(R * 1.3, Math.min(W, H) / 2 * .96);
    const sunX = cx + sx * orbit, sunY = cy - sy * orbit;

    ctx.clearRect(0, 0, W, H);

    if (sz < 0) { // 地球の裏側にいるとき: 光を描いてから地球の円で隠す
      drawSun(sunX, sunY, R, false);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // 輪郭
    ctx.strokeStyle = 'rgba(150,190,255,.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();

    // 点
    const bs = burstState(t), bp = bs.p, u = bs.on ? bp / BURST_D : 0;
    const shim = reduce ? 0 : Math.min(1, shakeS / 6) * 3.5 + energy * 1.5;
    const landR = R * .0105, seaR = R * .0038;
    for (let i = 0; i < N; i++) {
      const x = px[i], y = py[i], z = pz[i];
      const x1 = x * cl - z * sl, z1 = x * sl + z * cl;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const front = z2 > .02;
      let bu = 0;
      if (bs.on) {
        const lp = bp - dl[i], o = ot[i], e1 = o + BURST.hold, e2 = e1 + bk[i];
        if (lp > 0) bu = lp < o ? easeOut(lp / o) : lp < e1 ? 1 : lp < e2 ? 1 - easeInOut((lp - e1) / bk[i]) : 0;
      }
      if (!front && bu < .01) continue;
      let k = (x1 * sx + y2 * sy + z2 * sz + .12) / .42;
      k = k < 0 ? 0 : k > 1 ? 1 : k; k = k * k * (3 - 2 * k);
      const b = (k * (B - 1)) | 0;

      let X0 = x1, Y0 = y2;
      if (bu > 0) {
        const p = 1 + bu * dr[i];                         // 外へ弾ける(距離はバラバラ)
        const a = bu * spn[i] * (2 + 8 * u);              // 向きも速さもバラバラに回る
        const ca = Math.cos(a), sa = Math.sin(a);
        const xr = x1 * p, yr = y2 * p;
        const wob = bu * .07 * Math.sin(t * .006 * wb[i] + ph[i]);  // 飛んでいる間のぶれ
        X0 = xr * ca - yr * sa + bu * kx[i] + wob;
        Y0 = xr * sa + yr * ca + bu * ky[i] + wob * Math.cos(ph[i]);
      }
      let X = cx + X0 * R, Y = cy - Y0 * R;
      if (shim > .01) { const w = Math.sin(t * .04 + ph[i]); X += jx[i] * shim * w; Y += jy[i] * shim * w; }

      const isL = land[i] === 1;
      ctx.fillStyle = isL ? landS[b] : seaS[b];
      if (bu > 0) ctx.globalAlpha = front ? 1 : .45;  // 裏側の点は弾けている間だけ薄く見える
      ctx.beginPath();
      ctx.arc(X, Y, (isL ? landR : seaR) * (.55 + .45 * Math.max(z2, 0)), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 現在地のしるし
    const [mx, my, mz] = rot(loc.lat, loc.lon);
    if (mz > 0) {
      ctx.strokeStyle = 'rgba(255,240,210,.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx + mx * R, cy - my * R, R * .022, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,210,.8)';
      ctx.beginPath(); ctx.arc(cx + mx * R, cy - my * R, R * .0055, 0, TAU); ctx.fill();
    }

    if (sz >= 0) drawSun(sunX, sunY, R, true); // 手前にいるとき
  }

  /* ---------- ループ(静止中は1秒ごとにだけ再描画して省電力) ---------- */
  let last = performance.now(), lastDraw = 0;
  function frame(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t;

    if (!reduce && (screenX !== lsx || screenY !== lsy)) {
      kick(-(screenX - lsx) * 12, -(screenY - lsy) * 12);
      lsx = screenX; lsy = screenY;
    }

    // 現在地へ向けてなめらかに回転
    let dLon = loc.lon - view.lon; dLon = Math.atan2(Math.sin(dLon), Math.cos(dLon));
    const dLat = loc.lat - view.lat;
    if (Math.abs(dLon) + Math.abs(dLat) > 1e-4) {
      const e = 1 - Math.exp(-dt * 3);
      view.lon += dLon * e; view.lat += dLat * e; dirty = true;
    }

    step(dt);
    if (dirty || energy > .002 || Math.abs(ox) + Math.abs(oy) > .05 || burstState(t).on || t - lastDraw > (speed > 1 ? 40 : 1000)) {
      draw(t); lastDraw = t; dirty = false;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
