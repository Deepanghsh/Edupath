/**
 * backend/utils/ragAnswers.js
 * ============================
 * Local rule-based RAG engine — no external ML service needed.
 * Queries live MongoDB data (drives, students) to answer placement questions.
 *
 * Returns { answer: string }
 */

const CompanyDrive = require('../models/CompanyDrive');
const Student      = require('../models/Student');

// ── Keyword matchers ──────────────────────────────────────────────────────────
const is = (q, ...words) => words.some(w => q.includes(w));

async function answerQuery(query, student_id) {
  const q = query.toLowerCase().trim();

  // Fetch live data
  const [drives, students] = await Promise.all([
    CompanyDrive.find({ status: { $in: ['Active', 'Upcoming'] } }).lean(),
    Student.find({}, 'full_name cgpa active_backlogs tier skills branch year readiness_score').lean(),
  ]);

  const totalStudents = students.length;
  const me = student_id ? students.find(s => String(s._id) === String(student_id)) : null;

  // ── How many companies / drives ───────────────────────────────────────────
  if (is(q, 'how many compan', 'how many drive', 'total drive', 'total compan')) {
    return `There are currently **${drives.length} active/upcoming placement drives** available on EduPath.\n\nCompanies: ${drives.map(d => d.company_name).join(', ')}.`;
  }

  // ── My eligibility ────────────────────────────────────────────────────────
  if (me && is(q, 'am i eligible', 'my eligib', 'can i apply', 'eligible for me', 'which drive can i')) {
    const eligible = drives.filter(d => me.cgpa >= d.min_cgpa_required && me.active_backlogs <= d.max_backlogs_allowed);
    if (eligible.length === 0) {
      return `Based on your profile (CGPA: ${me.cgpa}, Backlogs: ${me.active_backlogs}), you are **not eligible** for any current drives. Work on improving your CGPA to unlock more opportunities.`;
    }
    return `You are eligible for **${eligible.length} drive(s)**:\n${eligible.map(d => `• ${d.company_name} — ${d.job_role} (Min CGPA: ${d.min_cgpa_required})`).join('\n')}`;
  }

  // ── Minimum CGPA for a specific company ───────────────────────────────────
  if (is(q, 'min cgpa', 'minimum cgpa', 'cgpa for', 'cgpa require')) {
    // Try to find a company name in the query
    const matchedDrive = drives.find(d => q.includes(d.company_name.toLowerCase()));
    if (matchedDrive) {
      return `**${matchedDrive.company_name}** requires a minimum CGPA of **${matchedDrive.min_cgpa_required}** for the ${matchedDrive.job_role} role.`;
    }
    // List all
    const lines = drives.map(d => `• ${d.company_name}: ${d.min_cgpa_required}`).join('\n');
    return `Minimum CGPA requirements for current drives:\n${lines}`;
  }

  // ── Backlogs allowed ──────────────────────────────────────────────────────
  if (is(q, 'backlog', 'kt allow', 'ktallow')) {
    const allowBacklogs = drives.filter(d => d.max_backlogs_allowed > 0);
    if (allowBacklogs.length === 0) return 'Currently, no active drive allows any backlogs.';
    return `Drives that allow backlogs:\n${allowBacklogs.map(d => `• ${d.company_name} — up to ${d.max_backlogs_allowed} backlog(s)`).join('\n')}`;
  }

  // ── Skills in demand ──────────────────────────────────────────────────────
  if (is(q, 'skill', 'demand', 'required skill', 'popular skill')) {
    const skillCount = {};
    drives.forEach(d => (d.required_skills || []).forEach(sk => {
      skillCount[sk] = (skillCount[sk] || 0) + 1;
    }));
    const sorted = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (sorted.length === 0) return 'No specific skill requirements found in current drives.';
    return `Top skills in demand across current drives:\n${sorted.map(([sk, cnt]) => `• ${sk} — required by ${cnt} company${cnt > 1 ? 'ies' : 'y'}`).join('\n')}`;
  }

  // ── PHP / specific language companies ─────────────────────────────────────
  const langKeywords = ['php', 'python', 'java', 'react', 'node', 'sql', 'flutter', 'machine learning', 'ml', 'dsa', 'c++', '.net', 'angular', 'vue'];
  for (const lang of langKeywords) {
    if (q.includes(lang)) {
      const matched = drives.filter(d =>
        (d.required_skills || []).some(sk => sk.toLowerCase().includes(lang)) ||
        (d.job_role || '').toLowerCase().includes(lang)
      );
      if (matched.length > 0) {
        return `Companies hiring **${lang.toUpperCase()}** developers:\n${matched.map(d => `• ${d.company_name} — ${d.job_role} (${d.avg_package || '?'} LPA)`).join('\n')}`;
      } else {
        return `No current drive specifically mentions **${lang.toUpperCase()}** in required skills. Check the Drive Browser for the latest openings.`;
      }
    }
  }

  // ── Package / salary ──────────────────────────────────────────────────────
  if (is(q, 'package', 'salary', 'ctc', 'lpa', 'pay')) {
    const withPkg = drives.filter(d => d.avg_package).sort((a, b) => {
      const pa = parseFloat(a.avg_package) || 0;
      const pb = parseFloat(b.avg_package) || 0;
      return pb - pa;
    });
    if (withPkg.length === 0) return 'Package details are not available for current drives.';
    return `Drives sorted by average package:\n${withPkg.map(d => `• ${d.company_name} — ${d.avg_package} LPA (${d.job_role})`).join('\n')}`;
  }

  // ── Placement rate ────────────────────────────────────────────────────────
  if (is(q, 'placement rate', 'how many placed', 'placement percent')) {
    const Application = require('../models/Application');
    const placed = await Application.countDocuments({ status: { $in: ['Selected', 'Offered'] } }).catch(() => 0);
    const total  = totalStudents || 1;
    const rate   = ((placed / total) * 100).toFixed(1);
    return `Current placement rate: **${rate}%** (${placed} placed out of ${total} students on platform). New drives are added regularly — keep checking!`;
  }

  // ── Visit date / upcoming ─────────────────────────────────────────────────
  if (is(q, 'upcoming', 'next drive', 'when is', 'visit date', 'schedule')) {
    const upcoming = [...drives].sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
    if (upcoming.length === 0) return 'No upcoming drives are scheduled at this time.';
    return `Upcoming drives by visit date:\n${upcoming.map(d => `• ${d.company_name} — ${new Date(d.visit_date).toDateString()} (${d.job_role})`).join('\n')}`;
  }

  // ── Tier / which companies for tier ──────────────────────────────────────
  if (me && is(q, 'my tier', 'which tier', 'tier')) {
    return `Your profile tier is **${me.tier}**.\n• Tier 1: CGPA ≥ 8.0\n• Tier 2: CGPA 6.5–7.9\n• Tier 3: CGPA below 6.5\n\nWork on improving your CGPA, DSA score, and OOPs marks to move up tiers.`;
  }

  // ── Generic company lookup ────────────────────────────────────────────────
  const companyMatch = drives.find(d => q.includes(d.company_name.toLowerCase()));
  if (companyMatch) {
    return `**${companyMatch.company_name}** drive details:\n• Role: ${companyMatch.job_role}\n• Min CGPA: ${companyMatch.min_cgpa_required}\n• Max Backlogs: ${companyMatch.max_backlogs_allowed}\n• Package: ${companyMatch.avg_package || 'N/A'} LPA\n• Skills: ${(companyMatch.required_skills || []).join(', ') || 'Not specified'}\n• Visit Date: ${companyMatch.visit_date ? new Date(companyMatch.visit_date).toDateString() : 'TBD'}`;
  }

  // ── How to improve / tips ─────────────────────────────────────────────────
  if (is(q, 'improve', 'tip', 'advice', 'how to', 'prepare', 'get placed')) {
    return `Tips to improve your placement chances:\n1. **CGPA** — Aim for 7.5+ to unlock most drives\n2. **DSA** — Score 70+ to pass technical screenings\n3. **OOPs** — Score 70+ for software engineering roles\n4. **Skills** — Add React, Node.js, Python, SQL to your profile\n5. **Backlogs** — Clear all active backlogs — they block many companies\n6. **Apply early** — Drives fill fast; use the Drive Browser daily!`;
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return `I have data on **${drives.length} active drives** and **${totalStudents} students**.\n\nTry asking:\n• "Which companies hire Python developers?"\n• "Which drives allow backlogs?"\n• "What is the minimum CGPA for TCS?"\n• "What skills are most in demand?"\n• "Show upcoming drives"`;
}

module.exports = { answerQuery };
