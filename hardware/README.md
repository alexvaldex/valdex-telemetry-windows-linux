# VX Hardware — design package

Reference designs for the VX rocketry hardware line. These boards are the
companion to the VX Telemetry ground-station software: every sensor here maps
directly to a field in the telemetry frame contract (`src/telemetry/schema.ts`).

## What's in here

| File | Board | Role |
|---|---|---|
| [board-b-ground-receiver.md](board-b-ground-receiver.md) | **B — Ground Station Receiver** | USB LoRa dongle → NDJSON into the app. Build this first. |
| [board-a-flight-computer.md](board-a-flight-computer.md) | **A — Flight Computer** | Airborne avionics + tracker. The flagship. |
| [board-c-pyro-deck.md](board-c-pyro-deck.md) | **C — Pyro / Power Deck** | Stackable 8-channel recovery expansion. Phase 2. |
| [vx-ground-station-receiver.sch](vx-ground-station-receiver.sch) | Board B schematic | EAGLE/Fusion import **test file** (see caveat below). |

## How to use this with Autodesk Fusion (Electronics)

**Read this first — it sets expectations honestly.**

The `.sch` file is an EAGLE-format schematic that Fusion's Electronics
workspace opens. Its job is to (1) prove the import path works in your Fusion
version and (2) drop the parts + architecture into Fusion so you're not
starting from a blank sheet.

It is **not** a finished, manufacturable board, and here's the critical part:
the component **footprints in the `.sch` are labelled placeholders** with the
correct pad *count* but generic pad *geometry*. Before you route or fabricate,
replace each one with a verified manufacturer footprint:

1. Open the `.sch` in Fusion → confirm it loads and the parts appear.
2. For each IC, download the real footprint + symbol + 3D model from
   **SnapEDA**, **Ultra Librarian**, or **Samacsys** (all export EAGLE/Fusion
   libraries), or use Fusion's built-in library manager.
3. Swap the placeholder device for the real one (same pin names → nets carry
   over).
4. Use the **per-board netlist tables** in the markdown files as the source of
   truth for connections — those are authoritative, the `.sch` wiring is
   illustrative.
5. Generate the board from the schematic, place, route, run DRC.

> ⚠️ **Safety:** Boards A and C switch pyrotechnic e-matches and a
> high-current battery rail. Do not fabricate with placeholder footprints or
> unverified pad geometry. Have the pyro FET, fuse, and continuity-sense
> sections reviewed before a build that will ever see a live charge.

## Design conventions across all three boards

- **Logic rail:** 3.3 V. All digital ICs share it.
- **Buses:** I²C (baro, fuel gauge, expanders), SPI (IMU, high-g, radio, flash,
  SD), UART (GPS, debug).
- **Radio:** Semtech SX1262 sub-GHz LoRa, or an Ebyte E22-900M module (SX1262 +
  TCXO + PA/LNA) to skip the RF matching network on v1.
- **Decoupling:** 100 nF per IC power pin + a 10 µF bulk cap per rail per board
  region. Not all shown individually in the netlists — add per standard
  practice.
- **Frequencies:** pick 915 MHz (US ISM) or 433 MHz to match your region and
  antennas. Keep it consistent between Board A and Board B.
