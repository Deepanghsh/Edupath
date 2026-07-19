/**
 * backend/utils/resumeParser.js
 * ==============================
 * Extracts text from a PDF or plain-text resume, then matches
 * it against a skill keyword dictionary to auto-detect skills.
 *
 * Supported input: Buffer (PDF) or plain text string.
 * Returns: { skills: string[], rawText: string, error?: string }
 */

// ── Skill keyword dictionary ──────────────────────────────────────────────────
// Keys are canonical skill names (matching allSkills in frontend).
// Values are regex patterns (case-insensitive) that match that skill.
const SKILL_PATTERNS = {
  'Python':           /\bpython\b/i,
  'Java':             /\bjava\b(?!script)/i,
  'JavaScript':       /\bjavascript\b|\bjs\b/i,
  'React':            /\breact\.?js?\b|\breact native\b/i,
  'Node.js':          /\bnode\.?js\b|\bexpress\.?js\b/i,
  'SQL':              /\bsql\b|\bmysql\b|\bpostgresql\b|\bsqlite\b/i,
  'MongoDB':          /\bmongodb\b|\bmongoose\b/i,
  'C++':              /\bc\+\+\b|\bcpp\b/i,
  'DSA':              /\bdata structures?\b|\balgorithms?\b|\bdsa\b|\bleetcode\b|\bcompetitive programming\b/i,
  'PHP':              /\bphp\b|\blaravel\b|\bwordpress\b/i,
  'UI/UX':            /\bui\/ux\b|\bfigma\b|\buser interface\b|\buser experience\b|\bwireframe\b|\bprototype\b/i,
  'Flutter':          /\bflutter\b|\bdart\b/i,
  'Machine Learning': /\bmachine learning\b|\bml\b|\bdeep learning\b|\bneural network\b|\btensorflow\b|\bpytorch\b|\bscikit-learn\b|\bkeras\b|\bnlp\b|\bcomputer vision\b/i,
  'Git':              /\bgit\b|\bgithub\b|\bgitlab\b/i,
  'Docker':           /\bdocker\b|\bkubernetes\b|\bk8s\b|\bcontainer\b/i,
  'AWS':              /\baws\b|\bamazon web services\b|\bec2\b|\bs3\b|\blambda\b/i,
  'TypeScript':       /\btypescript\b|\bts\b/i,
  'HTML':             /\bhtml5?\b|\bcss3?\b|\bbootstrap\b|\btailwind\b/i,
  'Android':          /\bandroid\b|\bkotlin\b/i,
  'iOS':              /\bios\b|\bswift\b|\bxcode\b/i,
  'Data Analysis':    /\bdata analysis\b|\bpandas\b|\bnumpy\b|\bmatplotlib\b|\bseaborn\b|\bexcel\b|\bpower bi\b|\btableau\b/i,
  'Spring Boot':      /\bspring boot\b|\bspring\b|\bmicroservices\b/i,
  'Django':           /\bdjango\b|\bflask\b|\bfastapi\b/i,
  'Redis':            /\bredis\b|\bmemcached\b/i,
  'GraphQL':          /\bgraphql\b/i,
  'Linux':            /\blinux\b|\bunix\b|\bbash\b|\bshell scripting\b/i,
};

// Map backend canonical names → frontend allSkills list
// (frontend uses a fixed subset; we still return all detected)
const FRONTEND_SKILLS = [
  'PHP', 'Python', 'React', 'Java', 'SQL', 'UI/UX',
  'Node.js', 'DSA', 'C++', 'MongoDB', 'Flutter', 'Machine Learning',
];

/**
 * Extract text from a PDF buffer using pdf-parse.
 * Falls back to treating buffer as UTF-8 text for non-PDFs.
 */
async function extractText(fileBuffer, filename = '') {
  const ext = filename.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const result   = await pdfParse(fileBuffer);
      return result.text || '';
    } catch (e) {
      console.warn('[ResumeParser] pdf-parse failed:', e.message);
      // Fallback: try as plain text
      return fileBuffer.toString('utf-8');
    }
  }

  // .txt, .doc, .docx (raw text fallback — docx has XML but keywords usually survive)
  return fileBuffer.toString('utf-8');
}

/**
 * Match skill keywords in text.
 * Returns only skills that appear in the frontend allSkills list
 * PLUS any extra detected skills.
 */
function matchSkills(text) {
  const detected = [];
  for (const [skill, pattern] of Object.entries(SKILL_PATTERNS)) {
    if (pattern.test(text)) detected.push(skill);
  }
  return detected;
}

/**
 * Main export — call with a file Buffer and filename.
 * Returns { skills, rawText, error? }
 */
async function parseResume(fileBuffer, filename) {
  try {
    const rawText = await extractText(fileBuffer, filename);
    if (!rawText || rawText.trim().length < 20) {
      return { skills: [], rawText: '', error: 'Could not extract text from file.' };
    }
    const skills = matchSkills(rawText);
    return { skills, rawText: rawText.slice(0, 2000) }; // return snippet for debugging
  } catch (err) {
    console.error('[ResumeParser] Error:', err.message);
    return { skills: [], rawText: '', error: err.message };
  }
}

module.exports = { parseResume, FRONTEND_SKILLS };
