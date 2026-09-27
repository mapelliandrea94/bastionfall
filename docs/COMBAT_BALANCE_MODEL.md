# Bastionfall Combat Balance Model v1

Batch 37 establishes a shared comparison model for the five tower foundations and Barracks. This model is diagnostic: it does not directly modify live combat stats.

## Reference budget

- Reference sustained DPS per 100 gold: 18
- Reference coverage range: 220
- Target power band: 0.90–1.10
- Power weights: 65% offense, 15% coverage, 20% utility

## Power index formula

1. Sustained DPS = damage / attack interval.
2. DPS per 100 gold = sustained DPS × 100 / cost.
3. Offense score = DPS per 100 gold / 18.
4. Coverage score = range / 220.
5. Utility score = 1 + role-specific utility credit.
6. Power Index = offense × 0.65 + coverage × 0.15 + utility × 0.20.

Barracks sustained DPS assumes all three baseline soldiers are alive and attacking. Utility credits are explicit provisional modelling coefficients, not hidden gameplay modifiers.

## Baseline snapshot

| Defense | DPS | DPS / 100g | Power Index | Status |
| --- | ---: | ---: | ---: | --- |
| Archer | 13.33 | 19.05 | 1.038 | in-band |
| Cannon | 20.00 | 18.18 | 1.056 | in-band |
| Frost | 6.67 | 7.41 | 0.663 | under-budget |
| Mage | 20.00 | 16.00 | 0.958 | in-band |
| Ballista | 23.64 | 16.30 | 1.024 | in-band |
| Barracks | 30.00 | 23.08 | 1.243 | over-budget |

## Interpretation

The model intentionally flags Frost and Barracks rather than silently changing them in Batch 37. Later combat, targeting, enemy-counter and economy batches can validate whether the utility assumptions justify those gaps before live stat tuning is applied.

A defense is not required to have identical raw DPS. The target is comparable total strategic value after offense, coverage and utility are considered.
