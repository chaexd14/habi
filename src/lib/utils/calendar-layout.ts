export type PositionedEvent<T> = {
  event: T;
  leftPercent: number;
  widthPercent: number;
  colIndex: number;
  totalCols: number;
};

export function defaultParseTimeToHours(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

export function parseEndTimeToHours(
  endTimeStr?: string | null,
  startTimeStr?: string | null,
  parseTimeToHours?: (timeStr?: string | null) => number | null
): number | null {
  if (!endTimeStr) return null;
  const parseFn = parseTimeToHours || defaultParseTimeToHours;
  let endH = parseFn(endTimeStr);
  if (endH === null) return null;
  const startH = parseFn(startTimeStr);
  if (endH === 0 || (startH !== null && endH < startH)) {
    endH += 24;
  }
  return endH;
}

type PreparedEvent<T> = {
  ev: T;
  start: number;
  end: number;
  originalIndex: number;
  colIdx?: number;
};

/**
 * Given a list of events for a single day, calculates side-by-side overlapping layout
 * column positions (left percent and width percent).
 */
export function computeOverlappingLayout<T extends { startTime?: string | null; endTime?: string | null }>(
  events: T[],
  parseTimeToHours: (timeStr?: string | null) => number | null,
  minHour: number
): Array<PositionedEvent<T>> {
  if (!events || events.length === 0) return [];

  // 1. Map events with start/end numeric hours and original index
  const prepared: PreparedEvent<T>[] = events.map((ev, index) => {
    const start = parseTimeToHours(ev.startTime) ?? minHour;
    const rawEnd = parseEndTimeToHours(ev.endTime, ev.startTime, parseTimeToHours) ?? (start + 1);
    const end = Math.max(rawEnd, start + 0.5); // Ensure minimum half-hour duration for layout
    return { ev, start, end, originalIndex: index };
  });

  // 2. Sort by start time ascending, then by duration descending
  prepared.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  // 3. Group into overlapping clusters
  const clusters: Array<PreparedEvent<T>[]> = [];
  let currentCluster: PreparedEvent<T>[] = [];
  let clusterEnd = -1;

  for (const item of prepared) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.end;
    } else if (item.start < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.end;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // 4. For each cluster, assign columns
  const result: Array<PositionedEvent<T>> = [];

  for (const cluster of clusters) {
    const columns: Array<PreparedEvent<T>[]> = [];

    for (const item of cluster) {
      let placed = false;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const lastInCol = columns[colIdx][columns[colIdx].length - 1];
        if (lastInCol.end <= item.start) {
          columns[colIdx].push(item);
          item.colIdx = colIdx;
          placed = true;
          break;
        }
      }
      if (!placed) {
        item.colIdx = columns.length;
        columns.push([item]);
      }
    }

    const numCols = columns.length;
    for (const item of cluster) {
      const colIdx = item.colIdx || 0;
      result.push({
        event: item.ev,
        leftPercent: (colIdx / numCols) * 100,
        widthPercent: 100 / numCols,
        colIndex: colIdx,
        totalCols: numCols,
      });
    }
  }

  return result;
}
