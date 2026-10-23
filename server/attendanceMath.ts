export interface SubjectAttendance {
  id: string;
  name: string;
  code: string;
  targetPercentage: number;
  theoryAttended: number;
  theoryTotal: number;
  labAttended: number;
  labTotal: number;
  credits?: number;
}

export interface AttendanceCalculation {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  targetPercentage: number;
  theory: {
    attended: number;
    total: number;
    percentage: number;
  };
  lab: {
    attended: number;
    total: number;
    percentage: number;
  };
  combined: {
    attended: number;
    total: number;
    percentage: number;
  };
  status: 'safe' | 'warning' | 'critical';
  classesNeededToTarget: number;
  safeBunkCount: number;
  theorySafeBunks: number;
  labSafeBunks: number;
}

export interface BunkPredictionResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  currentPercentage: number;
  predictedPercentage: number;
  percentageDrop: number;
  newStatus: 'safe' | 'warning' | 'critical';
  targetPercentage: number;
  isBelowTarget: boolean;
  explanation: string;
  theoryDetails: {
    current: number;
    predicted: number;
    classesMissedDelta: number;
  };
  labDetails: {
    current: number;
    predicted: number;
    classesMissedDelta: number;
  };
  overallSemesterImpact: {
    currentOverall: number;
    predictedOverall: number;
  };
}

/**
 * Accurately calculates attendance statistics and margin for a single subject
 */
export function calculateSubjectAttendance(subject: SubjectAttendance): AttendanceCalculation {
  const target = (subject.targetPercentage || 75) / 100;

  // Theory
  const tTotal = Math.max(0, subject.theoryTotal);
  const tAttended = Math.min(tTotal, Math.max(0, subject.theoryAttended));
  const tPct = tTotal === 0 ? 100 : Number(((tAttended / tTotal) * 100).toFixed(2));

  // Lab
  const lTotal = Math.max(0, subject.labTotal);
  const lAttended = Math.min(lTotal, Math.max(0, subject.labAttended));
  const lPct = lTotal === 0 ? 100 : Number(((lAttended / lTotal) * 100).toFixed(2));

  // Combined
  const totalConducted = tTotal + lTotal;
  const totalAttended = tAttended + lAttended;
  const combinedPct = totalConducted === 0 ? 100 : Number(((totalAttended / totalConducted) * 100).toFixed(2));

  // Classes needed to reach target:
  // (totalAttended + x) / (totalConducted + x) >= target
  // totalAttended + x >= target * totalConducted + target * x
  // x * (1 - target) >= target * totalConducted - totalAttended
  // x = ceil((target * totalConducted - totalAttended) / (1 - target))
  let classesNeeded = 0;
  if (combinedPct < subject.targetPercentage && totalConducted > 0) {
    const rawNeeded = Math.ceil((target * totalConducted - totalAttended) / (1 - target));
    classesNeeded = Math.max(0, rawNeeded);
  }

  // Safe bunks margin:
  // totalAttended / (totalConducted + y) >= target
  // target * y <= totalAttended - target * totalConducted
  // y = floor((totalAttended - target * totalConducted) / target)
  let safeBunkCount = 0;
  if (combinedPct >= subject.targetPercentage && totalConducted > 0) {
    const rawBunks = Math.floor((totalAttended - target * totalConducted) / target);
    safeBunkCount = Math.max(0, rawBunks);
  }

  // Theory safe bunks
  let theorySafeBunks = 0;
  if (tPct >= subject.targetPercentage && tTotal > 0) {
    theorySafeBunks = Math.max(0, Math.floor((tAttended - target * tTotal) / target));
  }

  // Lab safe bunks
  let labSafeBunks = 0;
  if (lPct >= subject.targetPercentage && lTotal > 0) {
    labSafeBunks = Math.max(0, Math.floor((lAttended - target * lTotal) / target));
  }

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (combinedPct < subject.targetPercentage) {
    status = 'critical';
  } else if (combinedPct < subject.targetPercentage + 5) {
    status = 'warning';
  }

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    targetPercentage: subject.targetPercentage,
    theory: {
      attended: tAttended,
      total: tTotal,
      percentage: tPct,
    },
    lab: {
      attended: lAttended,
      total: lTotal,
      percentage: lPct,
    },
    combined: {
      attended: totalAttended,
      total: totalConducted,
      percentage: combinedPct,
    },
    status,
    classesNeededToTarget: classesNeeded,
    safeBunkCount,
    theorySafeBunks,
    labSafeBunks,
  };
}

/**
 * Calculates overall attendance summary across all subjects
 */
export function calculateOverallAttendance(subjects: SubjectAttendance[], defaultTarget = 75) {
  let totalConducted = 0;
  let totalAttended = 0;
  let totalTheoryAttended = 0;
  let totalTheoryConducted = 0;
  let totalLabAttended = 0;
  let totalLabConducted = 0;

  const subjectStats = subjects.map((sub) => calculateSubjectAttendance(sub));

  for (const s of subjects) {
    totalTheoryAttended += s.theoryAttended;
    totalTheoryConducted += s.theoryTotal;
    totalLabAttended += s.labAttended;
    totalLabConducted += s.labTotal;
  }

  totalAttended = totalTheoryAttended + totalLabAttended;
  totalConducted = totalTheoryConducted + totalLabConducted;

  const overallPercentage = totalConducted === 0 ? 100 : Number(((totalAttended / totalConducted) * 100).toFixed(2));
  const theoryPercentage = totalTheoryConducted === 0 ? 100 : Number(((totalTheoryAttended / totalTheoryConducted) * 100).toFixed(2));
  const labPercentage = totalLabConducted === 0 ? 100 : Number(((totalLabAttended / totalLabConducted) * 100).toFixed(2));

  const atRiskSubjects = subjectStats.filter((s) => s.status === 'critical');
  const warningSubjects = subjectStats.filter((s) => s.status === 'warning');
  const safeSubjects = subjectStats.filter((s) => s.status === 'safe');

  return {
    overallPercentage,
    theoryPercentage,
    labPercentage,
    totalConducted,
    totalAttended,
    totalMissed: totalConducted - totalAttended,
    targetPercentage: defaultTarget,
    isBelowTarget: overallPercentage < defaultTarget,
    subjectStats,
    atRiskSubjects,
    warningSubjects,
    safeSubjects,
  };
}

export function findSubjectByQuery(allSubjects: SubjectAttendance[], query: string): SubjectAttendance | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();

  // Direct ID or Code match
  const exact = allSubjects.find((s) => s.id.toLowerCase() === q || s.code.toLowerCase() === q);
  if (exact) return exact;

  // Name inclusion
  const byName = allSubjects.find((s) => s.name.toLowerCase().includes(q));
  if (byName) return byName;

  // Acronym matching (e.g., DBMS -> Database Management Systems)
  const acronymMap: Record<string, string[]> = {
    dbms: ['database', 'management', 'systems', 'cs601'],
    os: ['operating', 'systems', 'kernel', 'cs602'],
    cn: ['computer', 'networks', 'network', 'cs603'],
    toc: ['theory', 'computation', 'automata', 'cs604'],
    web: ['web', 'technologies', 'frameworks', 'cs605'],
    ml: ['machine', 'learning', 'cs606'],
  };

  for (const [key, keywords] of Object.entries(acronymMap)) {
    if (q.includes(key)) {
      const match = allSubjects.find((s) => {
        const lowerName = s.name.toLowerCase();
        return keywords.some((kw) => lowerName.includes(kw) || s.code.toLowerCase().includes(kw));
      });
      if (match) return match;
    }
  }

  // Generative initialism matching (e.g. "DBMS" -> D-B-M-S)
  const byInitialism = allSubjects.find((s) => {
    const initials = s.name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toLowerCase();
    return initials === q || initials.includes(q);
  });
  if (byInitialism) return byInitialism;

  return undefined;
}

/**
 * Predicts attendance impact if student misses or attends upcoming classes
 */
export function simulateWhatIfBunk(
  allSubjects: SubjectAttendance[],
  subjectId: string,
  missTheoryCount = 1,
  missLabCount = 0,
  attendTheoryCount = 0,
  attendLabCount = 0
): BunkPredictionResult | null {
  const targetSub = findSubjectByQuery(allSubjects, subjectId);
  if (!targetSub) return null;

  const currentStats = calculateSubjectAttendance(targetSub);
  const currentOverall = calculateOverallAttendance(allSubjects);

  // New theory
  const newTheoryAttended = targetSub.theoryAttended + attendTheoryCount;
  const newTheoryTotal = targetSub.theoryTotal + attendTheoryCount + missTheoryCount;
  const newTheoryPct = newTheoryTotal === 0 ? 100 : Number(((newTheoryAttended / newTheoryTotal) * 100).toFixed(2));

  // New lab
  const newLabAttended = targetSub.labAttended + attendLabCount;
  const newLabTotal = targetSub.labTotal + attendLabCount + missLabCount;
  const newLabPct = newLabTotal === 0 ? 100 : Number(((newLabAttended / newLabTotal) * 100).toFixed(2));

  // Combined subject
  const newTotalAttended = newTheoryAttended + newLabAttended;
  const newTotalConducted = newTheoryTotal + newLabTotal;
  const predictedPct = newTotalConducted === 0 ? 100 : Number(((newTotalAttended / newTotalConducted) * 100).toFixed(2));

  const percentageDrop = Number((currentStats.combined.percentage - predictedPct).toFixed(2));

  // Overall impact
  const updatedSubjects = allSubjects.map((s) => {
    if (s.id === targetSub.id) {
      return {
        ...s,
        theoryAttended: newTheoryAttended,
        theoryTotal: newTheoryTotal,
        labAttended: newLabAttended,
        labTotal: newLabTotal,
      };
    }
    return s;
  });
  const newOverall = calculateOverallAttendance(updatedSubjects);

  let newStatus: 'safe' | 'warning' | 'critical' = 'safe';
  if (predictedPct < targetSub.targetPercentage) {
    newStatus = 'critical';
  } else if (predictedPct < targetSub.targetPercentage + 5) {
    newStatus = 'warning';
  }

  // Clear explanation
  let explanation = '';
  if (missTheoryCount > 0 || missLabCount > 0) {
    const bunkedParts: string[] = [];
    if (missTheoryCount > 0) bunkedParts.push(`${missTheoryCount} theory lecture${missTheoryCount > 1 ? 's' : ''}`);
    if (missLabCount > 0) bunkedParts.push(`${missLabCount} practical lab${missLabCount > 1 ? 's' : ''}`);
    const bunkDesc = bunkedParts.join(' and ');

    explanation = `Missing ${bunkDesc} of ${targetSub.name} will drop your attendance from ${currentStats.combined.percentage}% to ${predictedPct}%. `;
    if (predictedPct < targetSub.targetPercentage) {
      const neededAfter = Math.ceil((((targetSub.targetPercentage / 100) * newTotalConducted - newTotalAttended)) / (1 - (targetSub.targetPercentage / 100)));
      explanation += `WARNING: This drops you below the required ${targetSub.targetPercentage}% mark! You will need to attend the next ${Math.max(1, neededAfter)} consecutive classes to recover.`;
    } else {
      const remainingBunks = Math.floor((newTotalAttended - (targetSub.targetPercentage / 100) * newTotalConducted) / (targetSub.targetPercentage / 100));
      explanation += `You remain above the ${targetSub.targetPercentage}% requirement with ${Math.max(0, remainingBunks)} safe bunks left.`;
    }
  } else if (attendTheoryCount > 0 || attendLabCount > 0) {
    explanation = `Attending ${attendTheoryCount + attendLabCount} upcoming class(es) will raise ${targetSub.name} from ${currentStats.combined.percentage}% to ${predictedPct}%.`;
  }

  return {
    subjectId: targetSub.id,
    subjectName: targetSub.name,
    subjectCode: targetSub.code,
    currentPercentage: currentStats.combined.percentage,
    predictedPercentage: predictedPct,
    percentageDrop,
    newStatus,
    targetPercentage: targetSub.targetPercentage,
    isBelowTarget: predictedPct < targetSub.targetPercentage,
    explanation,
    theoryDetails: {
      current: currentStats.theory.percentage,
      predicted: newTheoryPct,
      classesMissedDelta: missTheoryCount,
    },
    labDetails: {
      current: currentStats.lab.percentage,
      predicted: newLabPct,
      classesMissedDelta: missLabCount,
    },
    overallSemesterImpact: {
      currentOverall: currentOverall.overallPercentage,
      predictedOverall: newOverall.overallPercentage,
    },
  };
}
