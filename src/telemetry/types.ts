export type TelemetryFrameV1 = {
  v: 1;
  t_ms: number;

  // Common / Tier 1
  alt_m?: number;
  vel_mps?: number;

  batt_v?: number;
  batt_pct?: number;

  rssi_dbm?: number;

  // IMU (Tier 2)
  ax?: number; ay?: number; az?: number;
  gx?: number; gy?: number; gz?: number;

  // GPS (Tier 2)
  lat?: number;
  lon?: number;
  gps_fix?: number;
  gps_sats?: number;

  // Orientation (Tier 2)
  q_w?: number; q_x?: number; q_y?: number; q_z?: number;

  // Events / pyro / states (Tier 3)
  event?: string;
  pyro_main_cont?: 0 | 1;
  pyro_drogue_cont?: 0 | 1;
};