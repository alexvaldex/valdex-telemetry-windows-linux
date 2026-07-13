export type TelemetryFrameV1 = {
  v: 1;
  t_ms: number;

  // Vehicle / stream id — lets one radio carry several transmitters
  // (booster + sustainer trackers, multiple rockets on one frequency).
  vid?: string | number;

  // Packet sequence number (per stream) — enables true packet-loss stats.
  seq?: number;

  // Common / Tier 1
  alt_m?: number;
  vel_mps?: number;

  batt_v?: number;
  batt_pct?: number;
  current_a?: number; // battery current draw

  rssi_dbm?: number;
  snr_db?: number;    // radio link signal-to-noise

  // IMU (Tier 2)
  ax?: number; ay?: number; az?: number;
  gx?: number; gy?: number; gz?: number;

  // GPS (Tier 2)
  lat?: number;
  lon?: number;
  gps_fix?: number;
  gps_sats?: number;
  gps_alt_m?: number; // GPS altitude (MSL) — compare against baro alt_m (AGL)

  // Orientation (Tier 2)
  q_w?: number; q_x?: number; q_y?: number; q_z?: number;

  // Environment (Tier 2) — onboard baro/temp/humidity sensors
  temp_c?: number;
  pressure_pa?: number;
  humidity_pct?: number;

  // Thrust vector control (Tier 3) — gimballed motor mount.
  // Commanded angles are what the controller asked for; *_fb_* are the servo
  // feedback/actual angles when the hardware reports them.
  tvc_pitch_deg?: number;
  tvc_yaw_deg?: number;
  tvc_pitch_fb_deg?: number;
  tvc_yaw_fb_deg?: number;
  tvc_enabled?: 0 | 1;

  // Canard fin control (Tier 3) — forward steering fins, typically 4 in an
  // X or + arrangement. Per-fin deflection in degrees, plus the roll-rate the
  // controller is trying to hold (deg/s) and its commanded roll effort.
  canard_1_deg?: number;
  canard_2_deg?: number;
  canard_3_deg?: number;
  canard_4_deg?: number;
  canard_roll_cmd_deg?: number; // commanded roll effort (−1..1 → deg), optional
  roll_rate_dps?: number;       // measured roll rate the canards are damping
  canard_enabled?: 0 | 1;

  // Events / pyro / states (Tier 3)
  event?: string;
  pyro_main_cont?: 0 | 1;
  pyro_drogue_cont?: 0 | 1;
};