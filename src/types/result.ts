import { isOwnDistanceValid } from '../lib/entry';

/**
 * Loop configuration
 */
export interface LoopConfig {
  id: 'small' | 'medium' | 'long';
  distance: number; // in km
  title: string;
  color: 'pink' | 'green' | 'blue';
}

/**
 * The approach distance (km) - from start to first loop junction and back
 * This is added once per run (not per loop)
 */
export const APPROACH_DISTANCE = 0.55;

/**
 * Loop distances for the running club (simple accessor)
 */
export const LOOP_DISTANCES = {
  small: 0.8,
  medium: 1.0,
  long: 1.2,
} as const;

/**
 * Loop configurations with full metadata
 */
export const LOOP_CONFIGS: Record<'small' | 'medium' | 'long', LoopConfig> = {
  small: {
    id: 'small',
    distance: 0.8,
    title: 'Small Loop',
    color: 'pink',
  },
  medium: {
    id: 'medium',
    distance: 1.0,
    title: 'Medium Loop',
    color: 'green',
  },
  long: {
    id: 'long',
    distance: 1.2,
    title: 'Long Loop',
    color: 'blue',
  },
};

/**
 * Participant data for a single run (persisted to GitHub)
 */
export interface Participant {
  runner: string; // Runner ID (slug) or "guest"
  guestName?: string; // Display name for guests (only when runner="guest")
  distance: number; // Total distance in km (explicit for own-route entries, loops all 0)
  smallLoops: number;
  mediumLoops: number;
  longLoops: number;
  time: string; // Format: "MM:SS"
}

/**
 * Run result data structure matching content/results/{YYYY-MM-DD}.md
 */
export interface RunResult {
  date: string; // ISO datetime string
  title: string;
  eventTitle: string;
  eventDescription?: string;
  location: string;
  mainPhoto?: string;
  weather?: string;
  isSpecialEvent: boolean;
  participants: Participant[];
  body?: string; // Markdown content after frontmatter
}

/**
 * Live tracking state for a participant during a run (runtime only)
 */
export interface LiveParticipant {
  runnerId: string; // Runner ID or "guest"
  repoId?: string; // Original ID to use when committing (e.g. 'guest')
  runnerName: string; // Display name
  runnerPhoto?: string; // Photo URL
  nickname?: string; // Runtime nickname for guests
  smallLoops: number;
  mediumLoops: number;
  longLoops: number;
  startTime: number; // Timestamp in ms
  finishTime?: number; // Elapsed time in ms when finished
  timerFinishTime?: number; // What the timer read when Stop was tapped (shown beside a typed time)
  timeInvalid?: boolean; // Typed time currently fails validation (blocks Complete / Save)
  ownDistance?: number; // km; set = "own route" (free-form distance), loops are ignored
  distanceInvalid?: boolean; // Typed own-route distance currently fails validation
  status: 'running' | 'finished' | 'completed';
  convertToRunner?: boolean; // Flag to create full runner on submit
  runnerNameOverride?: string; // Custom name for runner conversion (defaults to nickname)
}

/**
 * Distance for a live participant: the own-route distance if set, otherwise
 * loops plus the approach (approach only when there are any loops).
 */
export function participantDistance(p: Pick<LiveParticipant, 'smallLoops' | 'mediumLoops' | 'longLoops' | 'ownDistance'>): number {
  if (p.ownDistance !== undefined) return p.ownDistance;
  const totalLoops = p.smallLoops + p.mediumLoops + p.longLoops;
  const loopDistance =
    p.smallLoops * LOOP_DISTANCES.small +
    p.mediumLoops * LOOP_DISTANCES.medium +
    p.longLoops * LOOP_DISTANCES.long;
  return totalLoops > 0 ? APPROACH_DISTANCE + loopDistance : 0;
}

/** True when the participant's entry can be completed / saved. */
export function isEntryValid(p: LiveParticipant): boolean {
  if (p.timeInvalid) return false;
  if (p.ownDistance !== undefined) {
    return !p.distanceInvalid && isOwnDistanceValid(p.ownDistance);
  }
  return true;
}
