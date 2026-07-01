const GRID_COLS = 12;
const BAUD = 115200;

// Wrap GridLayout to avoid type errors in some TS setups
const RGL: any = GridLayout;

export default function App() {
  /** Serial UI */
  const [ports, setPorts] = useState<Array<{ path: string }>>([]);
  const [selected, setSelected] = useState("");

  /** Live telemetry */
  const [telemetry, setTelemetry] = useState(() => initialTelemetryState());

  /** Display Freeze */
  const [frozen, setFrozen] = useState(false);
  const [freezeIdx, setFreezeIdx] = useState<number | null>(null);

  /** Playback */
  const [playback, setPlayback] = useState<PlaybackState>({
    mode: "live",
    frames: [],
    rawLines: [],
    idx: 0,
    filename: undefined,
    playing: false,
    speed: 1,
  });

  /** Flight Mode / Layout Lock */
  const [flightMode, setFlightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("vx.flightMode") === "1";
    } catch {
      return false;
    }
  });
  function setFlightModePersist(next: boolean) {
    setFlightMode(next);
    localStorage.setItem("vx.flightMode", next ? "1" : "0");
  }

  /** Global units (moved to Settings UI) */
  const [globalUnits, setGlobalUnits] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem("vx.units");
    return saved === "imperial" || saved === "metric" ? (saved as UnitSystem) : "metric";
  });
  function saveGlobalUnits(next: UnitSystem) {
    setGlobalUnits(next);
    localStorage.setItem("vx.units", next);
  }

  /** Battery profile */
  const [battProfile, setBattProfile] = useState<BatteryProfile>(() => {
    try {
      const saved = localStorage.getItem("vx.battProfile");
      return saved ? (JSON.parse(saved) as BatteryProfile) : { chem: "LiPo", cells: 1, warnPct: 20, critPct: 10 };
    } catch {
      return { chem: "LiPo", cells: 1, warnPct: 20, critPct: 10 };
    }
  });
  function saveBattProfile(patch: Partial<BatteryProfile>) {
    setBattProfile((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("vx.battProfile", JSON.stringify(next));
      return next;
    });
  }

  /** Theme settings */
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem("vx.theme");
      return saved ? (JSON.parse(saved) as ThemeSettings) : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });
  function saveTheme(patch: Partial<ThemeSettings>) {
    setTheme((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("vx.theme", JSON.stringify(next));
      return next;
    });
  }
  function resetTheme() {
    setTheme(DEFAULT_THEME);
    localStorage.setItem("vx.theme", JSON.stringify(DEFAULT_THEME));
  }

  /** 3D model upload storage (NEW) */
  const [model3d, setModel3d] = useState<Model3D | null>(() => {
    try {
      const saved = localStorage.getItem("vx.model3d");
      return saved ? (JSON.parse(saved) as Model3D) : null;
    } catch {
      return null;
    }
  });
  function saveModel3D(m: Model3D | null) {
    setModel3d(m);
    if (m) localStorage.setItem("vx.model3d", JSON.stringify(m));
    else localStorage.removeItem("vx.model3d");
  }

  const fg = useMemo(() => autoTextColor(theme.bgB), [theme.bgB]);
  const chipFg = useMemo(() => autoTextColor("#1b2339"), []); // stable

  /** Per-widget settings */
  const [widgetSettings, setWidgetSettings] = useState<Record<string, WidgetSettings>>(() => {
    try {
      return JSON.parse(localStorage.getItem("vx.widgetSettings") || "{}");
    } catch {
      return {};
    }
  });
  function saveWidgetSettings(instKey: string, patch: WidgetSettings) {
    setWidgetSettings((prev) => {
      const next = { ...prev, [instKey]: { ...(prev[instKey] || {}), ...patch } };
      localStorage.setItem("vx.widgetSettings", JSON.stringify(next));
      return next;
    });
  }
  function resetWidgetAccent(instKey: string) {
    setWidgetSettings((prev) => {
      const next = { ...prev, [instKey]: { ...(prev[instKey] || {}) } };
      delete next[instKey].accent;
      localStorage.setItem("vx.widgetSettings", JSON.stringify(next));
      return next;
    });
  }

  /** Grid state */
  const [instances, setInstances] = useState<WidgetInstance[]>(() =>
    loadJSON<WidgetInstance[]>("vx.instances", [{ key: "raw-1", widgetId: "raw.console" }])
  );
  const [layout, setLayout] = useState<Layout>(() =>
    loadJSON<Layout>("vx.layout", [{ i: "raw-1", x: 0, y: 0, w: 12, h: 14 } as any])
  );

  /** Right-click context menu + advanced modal */
  const [menu, setMenu] = useState<MenuState>({ open: false });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  /** Settings modal */
  const [settingsOpen, setSettingsOpen] = useState(false);

  /** Command Palette */
  const [paletteOpen, setPaletteOpen] = useState(false);

  /** Alerts */
  const [alerts, setAlerts] = useState<Alert[]>([]);
  function pushAlert(a: Omit<Alert, "ts">) {
    setAlerts((prev) => {
      const now = Date.now();
      const next: Alert = { ...a, ts: now };
      const filtered = prev.filter((x) => x.id !== a.id);
      return [next, ...filtered].slice(0, 6);
    });
  }
  function clearAlert(id: string) {
    setAlerts((prev) => prev.filter((x) => x.id !== id));
  }

  /** Logging buffer (renderer-only) */
  const sessionStartRef = useRef<number>(Date.now());
  const logLinesRef = useRef<string[]>([]);
  const [logCount, setLogCount] = useState(0);

  /** Link/health tracking */
  const lastLineAtRef = useRef<number>(0);
  const lastFrameAtRef = useRef<number>(0);
  const dtMsWindowRef = useRef<number[]>([]);
  const [linkHealthTick, setLinkHealthTick] = useState(0);

  /** Telemetry ingest */
  useEffect(() => {
    const off = window.vx.onTelemetryLine((line: string) => {
      logLinesRef.current.push(line);
      if (logLinesRef.current.length > 200000) logLinesRef.current = logLinesRef.current.slice(-200000);
      setLogCount(logLinesRef.current.length);

      lastLineAtRef.current = performance.now();
      setTelemetry((prev) => pushRawLine(prev, line));

      try {
        const obj = JSON.parse(line);
        if (obj && obj.v === 1 && typeof obj.t_ms === "number") {
          const now = performance.now();
          const prevT = lastFrameAtRef.current;
          if (prevT > 0) {
            const dt = now - prevT;
            dtMsWindowRef.current.push(dt);
            if (dtMsWindowRef.current.length > 120) dtMsWindowRef.current.shift();
          }
          lastFrameAtRef.current = now;

          setTelemetry((prev) => pushFrame(prev, obj as TelemetryFrameV1));
          if (Math.random() < 0.08) setLinkHealthTick((x) => x + 1);
        }
      } catch {
        // ignore
      }
    });

    return () => {
      if (typeof off === "function") off();
    };
  }, []);

  /** Determine frames/latest to DISPLAY */
  const display = useMemo(() => {
    if (playback.mode === "playback") {
      const frames = playback.frames;
      const idx = clamp(playback.idx, 0, Math.max(0, frames.length - 1));
      const latest = frames[idx];
      return {
        mode: "playback" as const,
        frames,
        rawLines: playback.rawLines,
        latest,
        idx,
        n: frames.length,
        t_ms: latest?.t_ms ?? 0,
      };
    }

    const frames = telemetry.frames ?? [];
    const latest = telemetry.latest;

    if (!frames.length) {
      return { mode: "live" as const, frames, rawLines: telemetry.rawLines ?? [], latest, idx: -1, n: 0, t_ms: 0 };
    }

    if (frozen) {
      const idx = freezeIdx ?? frames.length - 1;
      const clamped = clamp(idx, 0, frames.length - 1);
      return {
        mode: "live" as const,
        frames,
        rawLines: telemetry.rawLines ?? [],
        latest: frames[clamped],
        idx: clamped,
        n: frames.length,
        t_ms: frames[clamped]?.t_ms ?? 0,
      };
    }

    return {
      mode: "live" as const,
      frames,
      rawLines: telemetry.rawLines ?? [],
      latest,
      idx: frames.length - 1,
      n: frames.length,
      t_ms: latest?.t_ms ?? 0,
    };
  }, [playback, telemetry, frozen, freezeIdx]);

  const caps = useMemo(() => deriveCapabilities(display.latest), [display.latest]);

  /** Serial actions */
  async function refreshPorts() {
    const p = await window.vx.serialList();
    setPorts(p);
    if (!selected && p[0]) setSelected(p[0].path);
  }
  async function connect() {
    sessionStartRef.current = Date.now();
    logLinesRef.current = [];
    setLogCount(0);

    lastLineAtRef.current = performance.now();
    lastFrameAtRef.current = 0;
    dtMsWindowRef.current = [];

    await window.vx.serialConnect({ path: selected, baudRate: BAUD });
  }
  async function disconnect() {
    await window.vx.serialDisconnect();
  }

  /** Widget ops */
  function addWidget(widgetId: WidgetId, w?: number, h?: number): string | null {
    if (flightMode) return null; // hard lock: no adding

    const def: any = WIDGETS.find((x: any) => x.id === widgetId);
    if (!def) return null;

    const key = `${widgetId}-${Date.now()}`;
    const nextInstances: WidgetInstance[] = [...instances, { key, widgetId }];

    const sizeW = w ?? def.defaultSize?.w ?? 6;
    const sizeH = h ?? def.defaultSize?.h ?? 6;

    const nextLayout: Layout = [...layout, { i: key, x: 0, y: Infinity, w: sizeW, h: sizeH } as any];

    setInstances(nextInstances);
    setLayout(nextLayout);
    persist(nextInstances, nextLayout);

    const accent = def?.defaultTheme?.accent;
    const view = def?.defaultView;
    if (accent || view) saveWidgetSettings(key, { accent, view });

    return key;
  }

  function removeWidget(key: string) {
    if (flightMode) return; // hard lock: no removing

    const nextInstances = instances.filter((x) => x.key !== key);
    const nextLayout = layout.filter((l) => l.i !== key);

    setInstances(nextInstances);
    setLayout(nextLayout);
    persist(nextInstances, nextLayout);

    setWidgetSettings((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      localStorage.setItem("vx.widgetSettings", JSON.stringify(next));
      return next;
    });
  }

  /** Right-click handlers */
  function openMenuAt(evt: React.MouseEvent, widgetKey?: string) {
    evt.preventDefault();
    evt.stopPropagation();
    setMenu({ open: true, x: evt.clientX, y: evt.clientY, widgetKey });
  }
  function closeMenu() {
    setMenu({ open: false });
  }

function 
  useEffect(() => {
    function onDown() {
      if (menu.open) setMenu({ open: false });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (menu.open) setMenu({ open: false });
        if (advancedOpen) setAdvancedOpen(false);
        if (settingsOpen) setSettingsOpen(false);
        if (paletteOpen) setPaletteOpen(false);
      }
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu.open, advancedOpen, settingsOpen, paletteOpen]);

  -->
  openMenuAt, (value: output <deriveCapabilities> input: display.latest)
  openMenuAt`(evt: React.MouseEvent, widgetKey?: string) {
    evt.preventDefault();
    evt.stopPropagation();
    setMenu({ open: true, x: evt.clientX, y: evt.clientY, widgetKey });
  }
  openMenuAt closeMenu() {
    function closeMenu() {
        value preset(value: output <deriveCapabilities> input: display.latest)
        value preset () {}}
    setMenu({ open: false });
  }


  /** Close menu / escape + shortcuts */
  useEffect(() => {}, [menu.open, advancedOpen, settingsOpen, paletteOpen]);
    function onDown() {
      if (menu.open) setMenu({ open: false });
    }
    function    onKey value output <deriveCapabilities> input: display.latest   
    battProfile (onKey e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (menu.open) setMenu({ open: false });
        if (advancedOpen) setAdvancedOpen(false);
        if (settingsOpen) setSettingsOpen(false);
        if (paletteOpen) setPaletteOpen(false);
      }
    }[
      window.addEventListener("mousedown", onDown);
      window.addEventListener("keydown", onKey);
      return () => {]}
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (menu.open) setMenu({ open: false });
        if (advancedOpen) setAdvancedOpen(false);
        if (settingsOpen) setSettingsOpen(false);
        if (paletteOpen) setPaletteOpen(false);

      }
      }
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey); 
      if any value preset () {}
    };
    tick speed 1;
  }, [menu.open, advancedOpen, settingsOpen, paletteOpen]); 
  value input display.latest    
  initialTelemetryState();  value output <deriveCapabilities> input: display.latest
  value input display.lates
    deriveCapabilities(display.latest); value output <deriveCapabilities> input: display.latest
    deriveCapabilities(display.latest); value output <deriveCapabilities> input: display.latest 
    function openMenuAt(evt: React.MouseEvent, widgetKey?: string) {
        evt.if else functino () {}
        close to esapce shift


    /** Close menu / escape + shortcuts */  useEffect(() => {   }, [menu.open, advancedOpen, settingsOpen, paletteOpen]);
    function openMenuAt(evt: React.MouseEvent, widgetKey?: string) {
        evt.preventDefault();
        evt.stopPropagation();
        setMenu({ open: true, x: evt.clientX, y: evt.clientY, widgetKey });
      }
    }


    /** Close menu / escape + shortcuts */

    useEffect(() => {   
    function onDown() {
      if (menu.open) setMenu({ open: false });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (menu.open) setMenu({ open: false });
        if (advancedOpen) setAdvancedOpen(false);
        if (settingsOpen) setSettingsOpen(false);
        if (paletteOpen) setPaletteOpen(false);
        if (paletteOpen) setPaletteOpen(true);
        