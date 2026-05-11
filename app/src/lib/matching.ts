import { getAllNgos, getNgoReliabilityScore, type Ngo, type Submission } from "./db";
import { haversineKm } from "./geo";

export interface RankedNgo extends Ngo {
  distance_km: number | null;
  reliability_score: number;
}

/**
 * Find the best matching NGOs for a submission, sorted by:
 *  1. Distance (closest first)
 *  2. Reliability score (highest first)
 *  3. Capacity weight
 *
 * Excludes NGOs in the `excludeIds` set (e.g. those that already rejected).
 */
export function rankNgosForSubmission(
  submission: Submission,
  excludeIds: Set<string> = new Set()
): RankedNgo[] {
  const ngos = getAllNgos().filter((n) => !excludeIds.has(n.id));

  const ranked: RankedNgo[] = ngos.map((ngo) => {
    let distance_km: number | null = null;
    if (
      submission.latitude != null && submission.longitude != null &&
      ngo.latitude != null && ngo.longitude != null
    ) {
      distance_km = haversineKm(
        submission.latitude, submission.longitude,
        ngo.latitude, ngo.longitude
      );
    }

    return {
      ...ngo,
      distance_km,
      reliability_score: getNgoReliabilityScore(ngo),
    };
  });

  // Sort: distance asc (nulls last), then reliability desc, then capacity weight desc
  ranked.sort((a, b) => {
    // Distance
    const da = a.distance_km ?? Infinity;
    const db_ = b.distance_km ?? Infinity;
    if (da !== db_) return da - db_;

    // Reliability
    if (a.reliability_score !== b.reliability_score) return b.reliability_score - a.reliability_score;

    // Capacity
    return capacityWeight(b.capacity) - capacityWeight(a.capacity);
  });

  return ranked;
}

function capacityWeight(cap: string): number {
  switch (cap) {
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
    default: return 2;
  }
}
