# Bastionfall Upgrade Curves v1

Batch 41 defines the shared upgrade economy for towers and Barracks. It is a modelling and preview layer; live upgrade purchases are not enabled by this batch.

## Level curve

| Level | Upgrade cost vs base | Damage | Attack interval | Range | Utility |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | — | 1.00× | 1.00× | 1.00× | 1.00× |
| 2 | 0.55× | 1.28× | 0.97× | 1.03× | 1.08× |
| 3 | 0.75× | 1.62× | 0.93× | 1.06× | 1.16× |
| 4 | 1.00× | 2.02× | 0.88× | 1.09× | 1.25× |

Upgrade costs are calculated from each defense's base cost and rounded up.

## Design target

The curve deliberately creates diminishing cost efficiency as a defense is upgraded. Higher levels improve slot efficiency and tactical specialization, but should not make building additional defenses economically obsolete.

Utility scaling applies only where relevant:
- Cannon: splash radius.
- Frost: slow strength and duration.
- Barracks: unit HP, respawn, engage/rally coverage.
- Other towers primarily gain damage, attack speed and modest range.

The model exposes per-level sustained DPS and DPS per 100 gold so future balance passes can compare upgrading versus expanding the board using the same metric.
