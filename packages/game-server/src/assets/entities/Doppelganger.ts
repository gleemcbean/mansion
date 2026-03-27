import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec2, Vec3 } from "@mansion/shared/types/util";
import Anomaly, { type AnomalyState } from "@mansion/shared/utils/Anomaly";
import { type PositionedRoom, type GameMap } from "@mansion/shared/utils/Map";
import type { WorldPos, GridConfig } from "@/utils/Pathfinding";
import { findPath } from "@/utils/Pathfinding";
import * as fs from "fs";
import * as path from "path";

const DETECTION_RADIUS = 5;
const ATTACK_RADIUS    = 0.6;
const MOVE_SPEED       = 2.5;
const GRIDS_DIR        = path.resolve("assets/pathfinding"); 

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dist2D(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

const gridCache = new Map<string, GridConfig>();

function loadGrid(roomId: string): GridConfig | null {
  if (gridCache.has(roomId)) return gridCache.get(roomId)!;
  const file = path.join(GRIDS_DIR, `${roomId}.json`);
  if (!fs.existsSync(file)) return null;
  const cfg = JSON.parse(fs.readFileSync(file, "utf-8")) as GridConfig;
  gridCache.set(roomId, cfg);
  return cfg;
}

function nearestPlayer(
  players: PlayerGameData[],
  from: Vec3,
  maxDist: number,
): PlayerGameData | null {
  let best: PlayerGameData | null = null;
  let bestDist = maxDist;
  for (const p of players) {
    const d = dist2D(p.position, from);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

export default class Doppelganger extends Anomaly {
  public static override id          = "doppelganger";
  public static override name        = "Doppelgänger";
  public static override description =
    "A mysterious entity that mimics the appearance of fungies within the mansion.\nCast your spell before it gets too close.";

  private waypoints: WorldPos[] = [];
  private waypointIndex         = 0;
  private target: PlayerGameData | null = null;

  protected override shouldFollow(players: PlayerGameData[]): boolean {
    return nearestPlayer(players, this.position, DETECTION_RADIUS) !== null;
  }

  protected override shouldAttack(players: PlayerGameData[]): boolean {
    return nearestPlayer(players, this.position, ATTACK_RADIUS) !== null;
  }

  protected override shouldRoam(players: PlayerGameData[]): boolean {
    return nearestPlayer(players, this.position, DETECTION_RADIUS) === null;
  }

  protected override onStateEnter(state: AnomalyState): void {
    if (state !== "follow") {
      this.waypoints     = [];
      this.waypointIndex = 0;
      this.target        = null;
    }
  }

  public override spawn(map: GameMap): [Vec3, Vec3] | null {
    const spawn = map.randomSpawn();
    if (!spawn) return null;
    this.position = [spawn[0], 0.865, spawn[1]];
    return [this.position, this.rotation];
  }

  public override update(map: GameMap, players: PlayerGameData[], deltaTime: number): void {
    this.updateState(players);

    switch (this.state) {
      case "roam":   break; // placeholder
      case "follow": this.updateFollow(map, players, deltaTime); break;
      case "attack": this.updateAttack(players); break;
    }
  }

  private updateFollow(map: GameMap, players: PlayerGameData[], deltaTime: number): void {
    const nearest = nearestPlayer(players, this.position, DETECTION_RADIUS);
    if (!nearest) return;

    // Repath when target changes or path is exhausted
    if (nearest !== this.target || this.waypointIndex >= this.waypoints.length) {
      this.target = nearest;

      const pos2D: Vec2 = [this.position[0], this.position[2]];
      const room: PositionedRoom | null = map.roomAt(pos2D);
      if (!room) return;

      const cfg = loadGrid(room.id);
      if (!cfg) return;

      const [rx, ry] = room.position;
      const start: WorldPos = { x: this.position[0] - rx, z: this.position[2] - ry };
      const goal:  WorldPos = { x: nearest.position[0] - rx, z: nearest.position[2] - ry };

      this.waypoints     = findPath(start, goal, cfg) ?? [];
      this.waypointIndex = 0;
    }

    this.moveAlongPath(deltaTime, map.roomAt([this.position[0], this.position[2]]));
  }

  private moveAlongPath(deltaTime: number, room: PositionedRoom | null): void {
    if (this.waypointIndex >= this.waypoints.length) return;

    const wp = this.waypoints[this.waypointIndex]!;

    const [rx, ry] = room?.position ?? [0, 0];
    const worldX = wp.x + rx;
    const worldZ = wp.z + ry;

    const dx = worldX - this.position[0];
    const dz = worldZ - this.position[2];
    const dist = Math.hypot(dx, dz);

    if (dist < 0.05) {
      this.waypointIndex++;
      return;
    }

    const step = Math.min(MOVE_SPEED * deltaTime, dist);
    this.position[0] += (dx / dist) * step;
    this.position[2] += (dz / dist) * step;

    this.rotation[1] = Math.atan2(dx, dz);
  }

  private updateAttack(players: PlayerGameData[]): void {
    // ?
  }
}