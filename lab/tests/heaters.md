# Heater test file

Status: v1, written from Imad's answers on 3 Nov 2026. Imad approves changes.
Covers: diesel, gas, electric, pellet heaters. Run in the standard testing room unless Imad says otherwise.

## Before every test (safety, always)
- Diesel, gas, pellet: room ventilated, CO detector ON and placed at breathing height, fire extinguisher reachable, nothing flammable within 1 m.
- Electric: check the socket/circuit rating against the heater's claimed wattage before switching on. No extension reels for high-power heaters.
- Stop the test at once if the CO detector alarms, there is smoke, or a smell of burning plastic.

## Fixed conditions (write them down each time)
- Room: standard testing room. Size: [NEEDED: Imad to measure once, L × W × H].
- Starting room temperature (thermometer, centre of room, 1 m high).
- Outside temperature that day.
- Test duration: [NEEDED: Imad to fix one duration, e.g. 30 or 60 min].
- Fuel: same fuel type and source for all diesel tests.

## Instruments
Thermometer, IR temperature gun, power meter (plug-in or clamp), sound level meter, CO detector, scale, stopwatch (phone).

## Claims to check (from the datasheet)

| # | Claim | How we measure | Instrument |
|---|---|---|---|
| 1 | Power draw (W) | Read at start-up (peak) and after 10 min (running). Electric heaters: this is effectively the heat output. | Power meter |
| 2 | Fuel use (L/h) | Weigh the tank before and after a timed run. Convert kg to litres with the fuel's density [NEEDED: density from the fuel supplier]. | Scale + stopwatch |
| 3 | Heat output (kW) | Electric: equals measured power draw. Fuel heaters: estimate from measured fuel use × energy content of the fuel [NEEDED: value from a cited source]; this is an indirect check, say so on camera. Also log the room temperature rise. | Power meter / scale + thermometer |
| 4 | Heat-up time | Time from switch-on until the outlet air reaches its stable temperature, and until the room rises by a fixed number of degrees [NEEDED: Imad picks the number]. | Stopwatch + IR gun + thermometer |
| 5 | Max outlet temperature | Highest stable outlet air temperature, IR gun at a fixed distance. | IR gun |
| 6 | Air flow / wind speed | Only if the datasheet states it and we have an anemometer (we don't yet). Otherwise note "not measured". | — |
| 7 | Noise (dB) | Sound meter 1 m in front of the heater at head height, at max and min setting. Note the room's background noise first. | Sound level meter |
| 8 | Smell | Imad's judgement at start-up, after 10 min and at shut-down: none / light / strong. | — |
| 9 | Safety | CO reading during the run. Tip-over switch: tilt test only if the heater claims one and it is safe to do. Overheat cut-off: only note if the datasheet claims it; do not provoke overheating. | CO detector |
| 10 | Value for money | Price paid (with source and date) against measured performance. Imad's call. | — |

Also noted, not scored: materials and build quality (body, burner, cables, plugs).

## Pass / fail
Imad sets the tolerance for each claim before the test. X records it in the `tolerance` column.

## Score out of 10
[NEEDED: Imad to approve the weighting before scores are used in content.] X only scores from recorded results.

## Recording
One row per claim in `results/results.csv`, plus a session report `results/<date>_<product>.md`.
