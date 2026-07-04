# Board A — VX Flight Computer

Airborne avionics + tracker. Reads the sensor suite, runs flight detection +
fusion, fires recovery pyros, logs to flash/SD, and downlinks the NDJSON frame
contract over LoRa. Every sensor maps 1:1 to a telemetry field.

## Sensor → telemetry-field map

| Sensor | Frame fields it feeds |
|---|---|
| Baro (MS5611) | `alt_m`, `pressure_pa`, `temp_c` |
| 9-DoF IMU (ICM-20948) | `ax ay az`, `gx gy gz`, and fused `q_w q_x q_y q_z` |
| High-g accel (H3LIS331) | `ax ay az` during boost (IMU saturates past ±16 g) |
| GPS (MAX-M10S) | `lat`, `lon`, `gps_fix`, `gps_sats`, `gps_alt_m` |
| Radio (SX1262) | link stats → `rssi_dbm`, `snr_db` (measured at the receiver) |
| Fuel gauge (INA226) | `batt_v`, `current_a` |
| Pyro sense | `pyro_main_cont`, `pyro_drogue_cont` |

## Block summary

```
        I²C ── MS5611 baro, INA226 fuel gauge
STM32F405 ─ SPI ── ICM-20948 IMU, H3LIS331 high-g, W25Q flash, microSD, SX1262
        UART ── MAX-M10S GPS
        GPIO/ADC ── 4× pyro FET + continuity, arming, buzzer, RGB LED
2S LiPo → reverse-protect + fuse → TPS63020 buck-boost 3.3 V ─ logic
                                  → switched pyro rail (direct) ─ recovery
USB-C → config / log pull
```

## Bill of materials

| Ref | Part | Value / MPN | Package | Footprint source |
|---|---|---|---|---|
| U1 | MCU | **STM32F405RGT6** (FPU, 1 MB flash) | LQFP-64 | SnapEDA / ST |
| U2 | Barometer | **MS5611-01BA03** | QFN-8 (LGA) | SnapEDA (or BMP390) |
| U3 | 9-DoF IMU | **ICM-20948** | QFN-24 (3×3) | SnapEDA |
| U4 | High-g accel ±400 g | **H3LIS331DL** | LGA-16 | SnapEDA (or ADXL375 ±200 g) |
| U5 | GPS module | **u-blox MAX-M10S** | 10.1×9.7 SMD | u-blox / SnapEDA |
| U6 | LoRa radio | **Ebyte E22-900M22S** (SX1262) | SMD module | Ebyte |
| U7 | Data-log flash | **W25Q128JVSIQ** | SOIC-8 | SnapEDA |
| U8 | Fuel gauge / current | **INA226** (V + I, I²C) | VSSOP-10 | SnapEDA |
| U9 | Buck-boost reg | **TPS63020** (3.3 V, 2 A) | QFN-11 | SnapEDA |
| Q1–Q4 | Pyro switch FETs | **CSD18540Q5B** logic-level N-MOS (or DMN2075U) | SON | SnapEDA |
| Q5 | Reverse-polarity P-FET | **DMP3017SFG** | SOT-23 | SnapEDA |
| Y1 | MCU crystal | 8 MHz (or use HSI) | 3.2×2.5 | — |
| J1 | Battery in | 2S LiPo, XT30 or JST | THT | — |
| J2 | USB-C | GCT USB4085-GF-A | SMD | SnapEDA |
| J3–J6 | Pyro terminals | 2-pos 3.5 mm screw ×4 | THT | — |
| J7 | microSD socket | push-push | SMD | SnapEDA |
| SW1 | Arming switch | screw-switch or key switch (in pyro rail) | THT | — |
| F1 | Battery fuse | 3–5 A resettable/blade | — | — |
| LS1 | Buzzer | magnetic, 3.3 V | SMD | — |
| D1 | Status LED | WS2812B RGB | 2020 | — |
| D2–D5 | Pyro flyback diodes | SS34 Schottky | SMA | — |
| R (sense) | INA226 shunt | 2 mΩ, 1 W | 2512 | — |
| passives | decoupling / dividers / gate R | 100 nF, 10 µF, 10 kΩ, 100 Ω | 0402/0805 | — |

## Netlist (authoritative connection table)

### Power
| Net | Pins |
|---|---|
| `VBATT` | J1.+ → F1 → Q5 (reverse-prot) → `VBATT_PROT` |
| `VBATT_PROT` | U9.VIN, U8.VIN+ (via 2 mΩ shunt → U8.VIN−), `PYRO_RAIL` via SW1 |
| `+3V3` | U9.VOUT, U1.VDD (×n), U2.VDD, U3.VDD/VDDIO, U4.VDD, U5.VCC, U6.VCC, U7.VCC, U8.VS, C(decoupling) |
| `PYRO_RAIL` | SW1 out → common drain-side supply for J3–J6 pyro + terminals |
| `GND` | common ground plane — all IC GND, pads, terminal returns, buzzer, LED |

### I²C bus (I2C1)
| Net | STM32 pin | Devices |
|---|---|---|
| `SCL1` | PB6 | U2 (baro) SCL, U8 (INA226) SCL, 4.7 kΩ→+3V3 |
| `SDA1` | PB7 | U2 SDA, U8 SDA, 4.7 kΩ→+3V3 |
| `BARO_PS` | — | MS5611 PS pin → GND selects I²C, or →+3V3 for SPI |

### SPI bus (SPI1) — IMU, high-g, radio, flash, SD share MOSI/MISO/SCK, separate CS
| Net | STM32 pin | Goes to |
|---|---|---|
| `SPI1_SCK` | PA5 | U3.SCK, U4.SPC, U7.CLK, U6.SCK, J7.CLK |
| `SPI1_MOSI` | PA7 | U3.SDI, U4.SDI, U7.DI, U6.MOSI, J7.CMD |
| `SPI1_MISO` | PA6 | U3.SDO/AD0, U4.SDO, U7.DO, U6.MISO, J7.DAT0 |
| `CS_IMU` | PB0 | U3.nCS |
| `CS_HIGHG` | PB1 | U4.CS |
| `CS_FLASH` | PB2 | U7.CS |
| `CS_SD` | PB12 | J7.DAT3/CS |
| `CS_LORA` | PA4 | U6.NSS |

### Radio control (SX1262 / E22 extra lines)
| Net | STM32 pin | E22 pin |
|---|---|---|
| `LORA_BUSY` | PC4 | BUSY |
| `LORA_DIO1` | PC5 | DIO1 (IRQ) |
| `LORA_NRST` | PC6 | NRST |
| `LORA_RXEN` | PC7 | RXEN |
| `LORA_TXEN` | PC8 | TXEN |

### GPS (USART1)
| Net | STM32 pin | MAX-M10S pin |
|---|---|---|
| `GPS_TX` | PA10 (RX) | TXD |
| `GPS_RX` | PA9 (TX) | RXD |
| `GPS_PPS` | PA8 | TIMEPULSE (optional, for time sync) |

### Pyro channels (×4: drogue, main, aux1/airstart, aux2/staging)
Each channel identical — example is drogue (Q1 / J3):
| Net | Connection |
|---|---|
| `FIRE_DROGUE` | STM32 PE0 → 100 Ω gate R → Q1.G ; 100 kΩ Q1.G→GND (hold-off) |
| pyro high side | `PYRO_RAIL` → J3.1 (e-match +) |
| pyro low side | J3.2 (e-match −) → Q1.D ; D2 flyback across e-match |
| Q1 source | `GND` |
| `CONT_DROGUE` | J3.2 → 10 kΩ/10 kΩ divider → STM32 ADC PA0 (continuity sense) ; 100 kΩ bleed |

Channels: drogue = PE0/PA0, main = PE1/PA1, aux1 = PE2/PA2, aux2 = PE3/PA3.

### Misc
| Net | Pins |
|---|---|
| `ARM_SENSE` | tap after SW1 → divider → ADC PC0 (report armed/disarmed) |
| `BUZZER` | STM32 PB8 (PWM) → LS1 |
| `LED_DIN` | STM32 PB9 → WS2812 D1 |
| `USB_DP/DM` | J2.DP/DM → STM32 PA12/PA11 |
| `SWDIO/SWCLK` | PA13/PA14 → debug header |
| `VBAT_ADC` | `VBATT_PROT` → 10 k/3.3 k divider → ADC PC1 (coarse voltage backup to INA226) |

## Critical design notes (do not skip)

- **Two-battery discipline:** logic (via U9) and pyro (`PYRO_RAIL`) share the
  same 2S pack here but through separate paths; `SW1` (arming) is in the pyro
  path only, so logic stays alive while pyros are safed. For L3, consider a
  fully separate pyro battery — that's what Board C provides.
- **FET hold-off:** every pyro gate needs a pulldown (100 kΩ) so a floating/
  booting MCU can't fire a channel. This is a safety-critical net.
- **High-g axis alignment:** mount U3 (IMU) and U4 (high-g) with known,
  documented axis orientation; the firmware's quaternion output (`q_*`) depends
  on it.
- **Continuity sense** reads e-match resistance through a divider off the low
  side — verify it can't source enough current to initiate (keep sense current
  well under the e-match no-fire current, typically <50 mA; aim for <1 mA).
- **RF vs GPS:** keep the LoRa module and GPS antenna separated; GPS is
  sensitive to the LoRa TX burst. Ground-pour between them.
