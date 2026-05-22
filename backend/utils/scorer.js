// utils/scorer.js
// FR-04: Heuristic Employability Score Calculator
// ES = (Academic × 0.4) + (Technical × 0.3) + (Aptitude × 0.3)
// As per Experiment_06 Implementation PDF

const calculateScore = (cgpa, dsa_marks, oops_marks) => {
  const academic  = (cgpa / 10) * 100;           // normalize CGPA → 0–100
  const technical = (dsa_marks + oops_marks) / 2; // avg of DSA + OOPs marks
  const aptitude  = 50;                            // default until tests integrated

  const ES = (academic * 0.4) + (technical * 0.3) + (aptitude * 0.3);

  let tier = 'Tier3';
  if (ES >= 80) tier = 'Tier1';
  else if (ES >= 50) tier = 'Tier2';

  return { score: parseFloat(ES.toFixed(2)), tier };
};

module.exports = calculateScore;
