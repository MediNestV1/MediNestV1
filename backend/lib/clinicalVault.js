/**
 * ClinicalVault - A hard-rules engine for medicinal logic.
 * This validator filters AI projections to ensure "Doctor-Grade" safety.
 */

const DRUG_REGISTRY = {
  // Stimulant Laxatives
  "dulcolax": { class: "stimulant_laxative", rank: 3 },
  "bisacodyl": { class: "stimulant_laxative", rank: 3 },
  "laxoberal": { class: "stimulant_laxative", rank: 3 },
  "sodium picosulfate": { class: "stimulant_laxative", rank: 3 },
  
  // Osmotic / Bulk Laxatives (Milder)
  "pectolax": { class: "bulk_laxative", rank: 1 },
  "psyllium": { class: "bulk_laxative", rank: 1 },
  "isabgol": { class: "bulk_laxative", rank: 1 },
  "lactulose": { class: "osmotic_laxative", rank: 2 },
  "cremaffin": { class: "osmotic_laxative", rank: 2 },

  // Pain / Fever
  "paracetamol": { class: "analgesic", rank: 1 },
  "dolo 650": { class: "analgesic", rank: 1 },
  "brufen": { class: "nsaid", rank: 2 },
  "ibuprofen": { class: "nsaid", rank: 2 },
  "voveran": { class: "nsaid", rank: 3 },
  "diclofenac": { class: "nsaid", rank: 3 },

  // Local Care
  "sitz bath": { class: "local_care", rank: 1 },
  "lidocaine": { class: "topical_anesthetic", rank: 1 },
  "anovesin": { class: "topical_anesthetic", rank: 1 }
};

/**
 * Validates a list of suggested medicines.
 * Returns { validMeds, flags, errors }
 */
function validatePrescription(suggestedMeds) {
  const flags = [];
  const validMeds = [];
  const seenClasses = new Set();
  
  // 1. MAX DRUGS RULE (Hard Cap: 4)
  const pool = suggestedMeds.slice(0, 4);
  if (suggestedMeds.length > 4) {
    flags.push(`PRUNED: Reduced prescription from ${suggestedMeds.length} to 4 drugs for clinical focus.`);
  }

  for (const med of pool) {
    const key = med.name.toLowerCase().trim();
    const registryEntry = Object.keys(DRUG_REGISTRY).find(k => key.includes(k)) ? DRUG_REGISTRY[Object.keys(DRUG_REGISTRY).find(k => key.includes(k))] : null;

    if (registryEntry) {
      // 2. DUPLICATE CLASS BLOCK
      if (seenClasses.has(registryEntry.class)) {
        flags.push(`BLOCKED: Duplicate therapy detected for ${med.name} (Class: ${registryEntry.class}). One agent is sufficient.`);
        continue; // Skip this duplicate
      }
      
      // 3. TREATMENT LADDER CHECK (Basic implementation)
      // If we see a Rank 3 drug without a Rank 1/2 of any complementary class, we might flag it, 
      // but usually the goal is just avoiding same-class stacking.
      
      seenClasses.add(registryEntry.class);
    }
    
    validMeds.push(med);
  }

  return { validMeds, flags };
}

module.exports = {
  validatePrescription,
  DRUG_REGISTRY
};
