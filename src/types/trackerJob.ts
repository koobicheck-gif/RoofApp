// TrackerJob type definitions for parsing job text messages

export type JobType =
  | 'Final Report'
  | 'Pipe Boot'
  | 'Pipe Jack'
  | 'Shingle Repair'
  | 'Flashing'
  | 'Valley Repair'
  | 'Ridge Cap'
  | 'Full Repair'
  | 'Other';

export type JobStatus = 'Pending' | 'Accepted' | 'Scheduled' | 'Completed' | 'Declined';

export interface TrackerJob {
  id: number;
  address: string;
  jobType: JobType;
  extras: string[];
  pitch: string;
  shingle: string;
  shingleType: string;
  shingleColor: string;
  pay: string;
  roofer: string;
  notes: string;
  status: JobStatus;
  raw: string;
  createdAt: number;
}

// Job type keywords mapping
const JOB_TYPE_KEYWORDS: Record<string, JobType> = {
  'roof final': 'Final Report',
  'final report': 'Final Report',
  'final': 'Final Report',
  'pipe boot': 'Pipe Boot',
  'pipe jack': 'Pipe Jack',
  'shingle repair': 'Shingle Repair',
  'shingle': 'Shingle Repair',
  'flashing': 'Flashing',
  'valley repair': 'Valley Repair',
  'valley': 'Valley Repair',
  'ridge cap': 'Ridge Cap',
  'ridge': 'Ridge Cap',
  'full repair': 'Full Repair',
  'full': 'Full Repair',
};

// Extra task keywords that start a line
const EXTRA_KEYWORDS = [
  'replace',
  'install',
  'paint',
  'caulk',
  'seal',
  'repair',
  'fix',
  'remove',
  'add',
  'clean',
];

/**
 * Parse a raw job text block into a TrackerJob object
 */
export function parseJobText(rawText: string): TrackerJob {
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const job: TrackerJob = {
    id: Date.now(),
    address: '',
    jobType: 'Other',
    extras: [],
    pitch: '',
    shingle: '',
    shingleType: '',
    shingleColor: '',
    pay: '',
    roofer: '',
    notes: '',
    status: 'Pending',
    raw: rawText,
    createdAt: Date.now(),
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanLine = line.replace(/^-\s*/, '').trim();
    const cleanLineLower = cleanLine.toLowerCase();

    // First line is usually the address (contains numbers and common address patterns)
    if (i === 0 || (!job.address && /\d+\s+\w+/.test(line) && /\b(ln|st|rd|dr|ave|blvd|ct|way|pl|cir)\b/i.test(line))) {
      job.address = cleanLine;
      continue;
    }

    // Check for pitch (e.g., "1 story, 8 pitch" or "2 story 10/12")
    if (/\d+\s*stor(y|ies)/i.test(cleanLine) || /\d+\s*(\/\d+)?\s*pitch/i.test(cleanLine)) {
      job.pitch = cleanLine;
      continue;
    }

    // Check for pay amount (starts with $ or contains dollar amount)
    if (/^\$?\d+/.test(cleanLine) && !job.pay) {
      job.pay = cleanLine.startsWith('$') ? cleanLine : `$${cleanLine}`;
      continue;
    }

    // Check for shingle info (common manufacturer names)
    if (/\b(CT|GAF|OC|Owens\s*Corning|CertainTeed|Atlas|Tamko|IKO)\b/i.test(cleanLine)) {
      job.shingle = cleanLine;
      // Extract shingle type (first word/abbreviation)
      const parts = cleanLine.split(/\s+/);
      job.shingleType = parts[0].toUpperCase();
      // Rest is the color
      job.shingleColor = parts.slice(1).join(' ');
      continue;
    }

    // Check for job type (Roof Final, Pipe Boot, etc.)
    let foundJobType = false;
    for (const [keyword, jobType] of Object.entries(JOB_TYPE_KEYWORDS)) {
      if (cleanLineLower.includes(keyword)) {
        job.jobType = jobType;
        foundJobType = true;

        // Check for inline extras (e.g., "Roof Final & Paint PVC Pipes")
        const ampersandMatch = cleanLine.match(/&\s*(.+)$/i);
        if (ampersandMatch) {
          job.extras.push(ampersandMatch[1].trim());
        }
        break;
      }
    }
    if (foundJobType) continue;

    // Check for extra tasks (Replace, Install, Paint, etc.)
    const startsWithExtra = EXTRA_KEYWORDS.some(kw => cleanLineLower.startsWith(kw));
    if (startsWithExtra) {
      // Remove parenthetical notes like "(pics 4-5)"
      const extraClean = cleanLine.replace(/\s*\([^)]*\)\s*/g, '').trim();
      job.extras.push(extraClean);
      continue;
    }

    // Check for roofer name (common patterns)
    if (/^(roofer|assigned|crew)[:=]?\s*/i.test(cleanLine)) {
      job.roofer = cleanLine.replace(/^(roofer|assigned|crew)[:=]?\s*/i, '').trim();
      continue;
    }

    // If it's a short line (1-2 words) and we don't have a roofer, it might be a name
    if (!job.roofer && cleanLine.split(/\s+/).length <= 2 && /^[A-Z][a-z]+/.test(cleanLine)) {
      job.roofer = cleanLine;
      continue;
    }
  }

  return job;
}

/**
 * Get materials list based on job type and extras
 */
export function getMaterialsForJob(job: TrackerJob): string[] {
  const materials: string[] = [];

  // Base materials by job type
  switch (job.jobType) {
    case 'Final Report':
      materials.push(`Shingles (${job.shingle || 'Match existing'})`);
      materials.push('Roofing nails');
      materials.push('Underlayment');
      break;
    case 'Pipe Boot':
      materials.push('Pipe boot(s)');
      break;
    case 'Pipe Jack':
      materials.push('Pipe jack(s)');
      break;
    case 'Shingle Repair':
      materials.push(`Shingles (${job.shingle || 'Match existing'})`);
      materials.push('Roofing nails');
      break;
    case 'Flashing':
      materials.push('Flashing material');
      materials.push('Roofing sealant');
      break;
    case 'Valley Repair':
      materials.push('Valley flashing');
      materials.push('Ice & water shield');
      break;
    case 'Ridge Cap':
      materials.push('Ridge cap shingles');
      materials.push('Ridge vent (if needed)');
      break;
    case 'Full Repair':
      materials.push(`Shingles (${job.shingle || 'Match existing'})`);
      materials.push('Roofing nails');
      materials.push('Underlayment');
      materials.push('Flashing');
      materials.push('Ridge cap');
      materials.push('Pipe boots');
      break;
    default:
      break;
  }

  // Parse extras for additional materials
  for (const extra of job.extras) {
    const extraLower = extra.toLowerCase();

    if (extraLower.includes('paint pvc') || extraLower.includes('pvc pipe')) {
      materials.push('PVC paint/sealant');
    }

    // Parse "Replace X pipe boots"
    const pipeBootMatch = extraLower.match(/replace\s+(\d+)\s*pipe\s*boots?/i);
    if (pipeBootMatch) {
      const count = parseInt(pipeBootMatch[1], 10);
      materials.push(`Pipe boots (${count})`);
    }

    if (extraLower.includes('caulk') || extraLower.includes('seal')) {
      materials.push('Roofing sealant/caulk');
    }
  }

  // Remove duplicates
  return [...new Set(materials)];
}

/**
 * Format scope of work from job type and extras
 */
export function formatScopeOfWork(job: TrackerJob): string {
  const items: string[] = [job.jobType];
  items.push(...job.extras);
  return items.join('\n- ');
}
