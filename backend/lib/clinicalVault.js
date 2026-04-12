/**
 * ClinicalVault - A hard-rules engine for medicinal logic.
 * This validator detects Clinical Anti-Patterns and Functional Redundancy.
 */

const FUNCTIONAL_GROUPS = {
  GI_UP: "Bowel Stimulant (Increases motility)",
  GI_DOWN: "Anti-Diarrheal (Decreases motility)",
  GI_SOFT: "Stool Softener / Bulk Fiber",
  PAIN: "Pain Relief",
  INFLAMMATION: "Anti-Inflammatory",
  ACID_CONTROL: "Acidity / Antacid",
  INFECTION: "Antibiotic / Anti-Infective",
  LOCAL_CARE: "Topical / Local Care"
};

const CONTRADICTORY_PATTERNS = [
  { pair: ["GI_UP", "GI_DOWN"], message: "Opposite mechanism detected: Promoting bowel movement while simultaneously stopping it." },
  { pair: ["GI_SOFT", "GI_DOWN"], message: "Conflicting intent: Softening stool while attempting to stop diarrhea." }
];

const DRUG_REGISTRY = {
  "dulcolax": "GI_UP",
  "bisacodyl": "GI_UP",
  "laxoberal": "GI_UP",
  "sodium picosulfate": "GI_UP",
  "loperamide": "GI_DOWN",
  "lomotil": "GI_DOWN",
  "pectolax": "GI_SOFT",
  "psyllium": "GI_SOFT",
  "isabgol": "GI_SOFT",
  "lactulose": "GI_SOFT",
  "paracetamol": "PAIN",
  "dolo 650": "PAIN",
  "brufen": "INFLAMMATION",
  "ibuprofen": "INFLAMMATION",
  "diclofenac": "INFLAMMATION",
  "pantoprazole": "ACID_CONTROL",
  "ranitidine": "ACID_CONTROL",
  "sitz bath": "LOCAL_CARE",
  "lidocaine": "LOCAL_CARE"
};

/**
 * Validates a list of suggested medicines.
 * suggestedMeds: Array of { name, type, dose, freq, duration, instructions, tier, functionalGroup }
 */
function validatePrescription(suggestedMeds) {
  const flags = [];
  const validMeds = [];
  
  // 1. Group analysis
  const activeFunctionGroups = new Set();
  
  // 2. CONTRADICTORY PATTERN DETECTION
  suggestedMeds.forEach(m => {
    const fGroup = m.functionalGroup || getFunctionalGroup(m.name);
    activeFunctionGroups.add(fGroup);
  });

  CONTRADICTORY_PATTERNS.forEach(pattern => {
    if (pattern.pair.every(g => activeFunctionGroups.has(g))) {
      flags.push(`🛡️ CRITICAL PATTERN ERROR: ${pattern.message}`);
    }
  });

  // 3. HIERARCHICAL PRUNING (Core -> Supportive -> Optional)
  // Step A: Keep all CORE
  const coreMeds = suggestedMeds.filter(m => m.tier === 'CORE');
  validMeds.push(...coreMeds);
  const coreFunctionalGroups = new Set(coreMeds.map(m => m.functionalGroup || getFunctionalGroup(m.name)));

  // Step B: Filter SUPPORTIVE (Keep only one per functional group not covered by CORE)
  const supportiveMeds = suggestedMeds.filter(m => m.tier === 'SUPPORTIVE');
  const addedSupportiveGroups = new Set();
  
  supportiveMeds.forEach(m => {
    const fGroup = m.functionalGroup || getFunctionalGroup(m.name);
    if (!coreFunctionalGroups.has(fGroup) && !addedSupportiveGroups.has(fGroup)) {
      validMeds.push(m);
      addedSupportiveGroups.add(fGroup);
    } else {
      flags.push(`PRUNED: Redundant supportive drug for ${FUNCTIONAL_GROUPS[fGroup] || fGroup} (${m.name}) removed.`);
    }
  });

  // Step C: OPTIONAL (Only keep if total meds < 4 and no functional duplication)
  const optionalMeds = suggestedMeds.filter(m => m.tier === 'OPTIONAL');
  optionalMeds.forEach(m => {
    const fGroup = m.functionalGroup || getFunctionalGroup(m.name);
    if (validMeds.length < 4 && !activeFunctionGroups.has(fGroup) && !addedSupportiveGroups.has(fGroup) && !coreFunctionalGroups.has(fGroup)) {
      validMeds.push(m);
    } else {
      // Quietly prune optional
    }
  });

  return { validMeds, flags };
}

function getFunctionalGroup(name) {
  const key = name.toLowerCase().trim();
  const matchedKey = Object.keys(DRUG_REGISTRY).find(k => key.includes(k));
  return matchedKey ? DRUG_REGISTRY[matchedKey] : "UNKNOWN";
}

module.exports = {
  validatePrescription,
  FUNCTIONAL_GROUPS
};
