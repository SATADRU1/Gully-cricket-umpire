# Scoring rules implemented by packages/core

## Rules you can configure
oversPerInnings, ballsPerOver, wideRuns, noBallRuns, widesReBowled,
noBallsReBowled, freeHitOnNoBall, lastManStands, lbwEnabled.

## Deliveries
- Total runs on a ball = batRuns + extraRuns + penalty (wide / no-ball penalty).
- Wide: no runs off the bat, batter does not face a ball. Re-bowled by default.
- No-ball: bat runs go to the batter, penalty goes to the bowler. Starts a free hit.
- Bye / leg-bye: runs go to the team, not to batter or bowler. Ball counts as faced.
- All runs on a wide or no-ball (including byes run) are filed under that extra type.

## Wickets
- Credited to the bowler: bowled, caught, lbw, stumped, hitwicket.
- Not credited to the bowler: runout, other (house rules such as over-the-wall).
- On a wide only stumped, runout, hitwicket and other are possible.
- On a no-ball or free hit only runout and other are possible.
- Runs do not count on a ball where a non-run-out wicket falls.
- Run-out: completed runs count, strike rotates for them, then the new batter
  takes the dismissed batter's place. Use the swapEnds event if the umpire says
  the batters crossed differently.

## Strike
- Rotates on an odd number of runs run, and at the end of every over.
- With last-man-stands, the final batter bats alone with no rotation.

## Innings end
targetChased, allOut, or oversDone, checked in that order.
Normal: all out at (players - 1) wickets. Last-man-stands: at (players) wickets.