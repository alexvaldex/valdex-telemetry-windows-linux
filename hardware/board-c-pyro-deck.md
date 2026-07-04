# Board C — VX Pyro / Power Deck (optional, phase 2)

Stackable expansion for L3 / complex recovery / two-stage. Adds 8 high-current
pyro channels with their own isolated battery, driven from Board A over the
stack header. Keeps recovery energy off the flight computer.

## Block summary

```
Board A ──stack header (I²C/SPI + 3V3 + GND)──► STM32G031 (deck controller)
                                                   │  drives
                          8× MOSFET channels ◄─────┤  gate lines
                          continuity mux ─────────►┤  ADC
Separate pyro battery → e-switch → channel commons (isolated high-current rail)
```

Two design options for the deck brain:
- **Smart (recommended):** small MCU (STM32G031) — talks I²C/SPI to Board A,
  owns fire logic + continuity locally. Safer (local arm interlock) and fewer
  stack wires.
- **Dumb:** I²C GPIO expander (MCP23017) for gates + ADS1115/analog-mux for
  continuity. Cheaper, but all timing lives on Board A.

## Bill of materials (smart variant)

| Ref | Part | Value / MPN | Package | Notes |
|---|---|---|---|---|
| U1 | Deck MCU | **STM32G031K8** | LQFP-32 | I²C/SPI slave to Board A |
| U2 | Continuity mux | **74HC4051** 8:1 analog mux | TSSOP-16 | 8 ch → 1 ADC |
| U3 | Rail e-switch driver | **TPS22810** load switch (or P-FET) | — | arms high-current rail |
| Q1–Q8 | Channel FETs | **CSD18540Q5B** logic-level N-MOS | SON | one per channel |
| D1–D8 | Flyback diodes | SS34 | SMA | across each e-match |
| F1–F8 | Per-channel fuse | 5 A | 1206 / clip | optional but recommended |
| J1 | Stack header | 2×10 2.54 mm | THT | I²C/SPI + 3V3 + GND from Board A |
| J2 | Pyro battery in | 2S–4S, XT30 | THT | **isolated** from logic |
| J3–J10 | Channel terminals | 2-pos 3.5 mm screw ×8 | THT | e-match out |
| SW1 | Deck arming | screw/key switch | THT | in pyro-rail path |
| C, R | bulk 100 µF + gate 100 Ω + hold-off 100 kΩ + cont. dividers | — | 0805/0402 | per channel |

## Netlist (per-channel pattern, ×8)

Channel _n_ (Q_n_ / J_(n+2)_):
| Net | Connection |
|---|---|
| `FIRE_n` | U1 GPIO → 100 Ω → Q_n_.G ; 100 kΩ Q_n_.G→GND |
| high side | `PYRO_RAIL_SW` → F_n_ → J.1 (e-match +) |
| low side | J.2 (e-match −) → Q_n_.D ; D_n_ flyback |
| source | `PGND` (pyro ground) |
| `CONT_n` | J.2 → 10 k/10 k divider → 74HC4051 channel _n_ |

Shared:
| Net | Pins |
|---|---|
| `PYRO_BATT` | J2.+ → SW1 → U3 → `PYRO_RAIL_SW` |
| `PGND` | J2.− , all Q sources, screw returns — **tied to logic GND at one star point only** |
| `MUX_OUT` | 74HC4051 COM → U1.ADC |
| `MUX_SEL[0:2]` | U1 GPIO ×3 → 74HC4051 A/B/C |
| stack `SDA/SCL` or `SPI` | J1 → U1 (address/CS strapped so multiple decks can stack) |
| `+3V3` | J1 → U1.VDD, U2.VCC (logic only — never the pyro rail) |

## Critical design notes

- **Isolated pyro battery + single-point ground.** The whole reason this board
  exists is to keep recovery current off the flight computer. Tie `PGND` to
  logic `GND` at exactly one star point.
- **Local arm interlock.** With the smart MCU, require an explicit armed command
  *and* the physical `SW1` before any `FIRE_n` can assert. Gate pulldowns
  mandatory.
- **Stack addressing.** Strap each deck's I²C address / SPI CS so two decks
  (16 channels) can share the bus.
- **Fuse + flyback per channel** — a shorted e-match or wiring fault must not
  take out the rail or the FET.
