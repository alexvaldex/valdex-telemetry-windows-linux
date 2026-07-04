# Board B — VX Ground Station Receiver

USB LoRa dongle. Receives the flight computer's telemetry and streams it to the
VX Telemetry app as NDJSON over a USB serial (CDC) port. Simplest board — build
this first; it makes the app useful with *any* SX1262/LoRa flight computer, not
just Board A.

## Block summary

```
Antenna → SX1262 LoRa ──SPI──► RP2040 ──USB-C (CDC serial, NDJSON)──► host app
                                  │
                          QSPI ──► W25Q128 flash (firmware)
                     USB 5V → 3.3 V LDO → logic rail
                 optional: SSD1306 OLED + RGB LED (field UI)
```

## Bill of materials

| Ref | Part | Value / MPN | Package | Footprint source |
|---|---|---|---|---|
| U1 | LoRa transceiver module | **Ebyte E22-900M22S** (SX1262 + TCXO + LNA/PA) | SMD module | Ebyte datasheet / SnapEDA |
| U2 | MCU | **RP2040** | QFN-56 (7×7) | SnapEDA / Raspberry Pi KiCad→export |
| U3 | QSPI boot flash | **W25Q128JVSIQ** (16 MB) | SOIC-8 (208 mil) | SnapEDA |
| U4 | 3.3 V LDO | **AP2112K-3.3** (600 mA) | SOT-23-5 | SnapEDA |
| Y1 | Crystal | 12 MHz, 18 pF | 3.2×2.5 SMD | SnapEDA |
| J1 | USB-C receptacle | GCT **USB4085-GF-A** (USB 2.0, 16-pin) | SMD | GCT / SnapEDA |
| J2 | RF connector | SMA edge or u.FL | — | (or use module's onboard IPEX) |
| SW1 | BOOTSEL button | tactile SMD | 3.5×2.9 | generic |
| SW2 | RESET button | tactile SMD | 3.5×2.9 | generic |
| D1 | Status LED | WS2812B-2020 (addressable RGB) | 2020 | SnapEDA |
| DISP1 | OLED (optional) | SSD1306 128×64 I²C | 0.96" module | — |
| R1,R2 | USB CC pulldowns | 5.1 kΩ | 0402 | — |
| R3 | LED data series | 330 Ω | 0402 | — |
| R4,R5 | I²C pull-ups (OLED) | 4.7 kΩ | 0402 | — |
| C1,C2 | Crystal load caps | 15 pF | 0402 | — |
| C3–C10 | Decoupling | 100 nF | 0402 | — |
| C11 | LDO input bulk | 10 µF | 0805 | — |
| C12 | LDO output bulk | 10 µF | 0805 | — |
| C13 | RP2040 core (1.1 V LDO out) | 1 µF | 0402 | — |

> RP2040 has an internal 1.1 V core LDO — add its 1 µF output cap (C13) on the
> `VREG_VOUT`/`USB_VDD` net per the RP2040 hardware design guide. Board B's
> external LDO (U4) supplies the 3.3 V `IOVDD`/`DVDD`/analog pins.

## Netlist (authoritative connection table)

### Power
| Net | Pins |
|---|---|
| `VBUS_5V` | J1.VBUS, U4.VIN, C11.1 |
| `+3V3` | U4.VOUT, U2.IOVDD (×6), U2.DVDD, U2.ADC_AVDD, U2.VREG_VIN, U3.VCC, U1.VCC, DISP1.VCC, C12.1, C3–C10.1, R4.1, R5.1 |
| `GND` | J1.GND, J1.SHIELD, U4.GND, U2.GND (pad + GND pins), U3.GND, U1.GND, Y1 caps, all C.2, D1.GND, DISP1.GND |
| `VREG_1V1` | U2.VREG_VOUT, C13.1 (RP2040 internal core rail) |

### USB
| Net | Pins |
|---|---|
| `USB_DP` | J1.DP1, J1.DP2, U2.USB_DP |
| `USB_DM` | J1.DM1, J1.DM2, U2.USB_DM |
| `CC1` | J1.CC1, R1.1 (R1.2→GND) |
| `CC2` | J1.CC2, R2.1 (R2.2→GND) |

### SPI — RP2040 ↔ SX1262 (SPI0)
| Net | RP2040 pin | SX1262/E22 pin |
|---|---|---|
| `LORA_SCK` | GP2 | SCK |
| `LORA_MOSI` | GP3 | MOSI |
| `LORA_MISO` | GP4 | MISO |
| `LORA_NSS` | GP5 | NSS |
| `LORA_BUSY` | GP6 | BUSY |
| `LORA_DIO1` | GP7 | DIO1 (IRQ) |
| `LORA_NRST` | GP8 | NRST |
| `LORA_RXEN` | GP9 | RXEN (E22 module) |
| `LORA_TXEN` | GP10 | TXEN (E22 module) |

### QSPI — RP2040 ↔ boot flash (dedicated pins)
| Net | RP2040 pin | W25Q128 pin |
|---|---|---|
| `QSPI_CS` | QSPI_SS | CS (1) |
| `QSPI_SCK` | QSPI_SCLK | CLK (6) |
| `QSPI_SD0` | QSPI_SD0 | DI/IO0 (5) |
| `QSPI_SD1` | QSPI_SD1 | DO/IO1 (2) |
| `QSPI_SD2` | QSPI_SD2 | /WP/IO2 (3) |
| `QSPI_SD3` | QSPI_SD3 | /HOLD/IO3 (7) |

### Clock / control / UI
| Net | Pins |
|---|---|
| `XIN` | U2.XIN, Y1.1, C1.1 |
| `XOUT` | U2.XOUT, Y1.2, C2.1 |
| `RUN` | U2.RUN, SW2.1 (SW2.2→GND), 1 kΩ pull-up to +3V3 |
| `BOOTSEL` | U3.CS via SW1 to GND (standard RP2040 boot circuit) |
| `LED_DIN` | U2.GP16 → R3 → D1.DIN |
| `SDA` | U2.GP20 → DISP1.SDA, R4.2 |
| `SCL` | U2.GP21 → DISP1.SCL, R5.2 |

## Firmware note

The receiver firmware's only job: configure the SX1262 (frequency, SF, BW, CR
to match Board A), receive packets, and write each received line to USB CDC
**verbatim** — the flight computer already emits the NDJSON frame contract, so
the receiver is a transparent radio-to-USB bridge. Optionally append the
NMEA-style CRC (`*XXXX`) if the flight computer doesn't, so the app's Link
Quality widget can count corrupt frames.

## Antenna

915 MHz: ¼-wave whip ≈ 78 mm, or a duck antenna via SMA. Keep the module's RF
trace 50 Ω, keep the antenna end at a board edge, and keep the switching
LDO/USB away from the RF section.
