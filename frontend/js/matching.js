/**
 * FarmOS — Intelligent Rule-Based Matching Engine
 * Team: NEXUS | Smart India Hackathon 2026 (PS 26132)
 * 
 * Scores compatibility between Produce Lots and Buyer Requirements (0 - 100)
 * Weights:
 * - Price Fit: 30%
 * - Reliability Placeholder: 25% (default score: 80 / 100)
 * - Quantity Fit: 20%
 * - Location Match: 15%
 * - Data Completeness: 10%
 */

export function calculateMatchScore(lot, requirement) {
  // 1. Fundamental Gate: Crop Match
  const lotCropId = lot.crop_id;
  const reqCropId = requirement.crop_id;
  if (!lotCropId || !reqCropId || lotCropId !== reqCropId) {
    return {
      score: 0,
      isMatch: false,
      breakdown: { price: 0, reliability: 0, quantity: 0, location: 0, completeness: 0 },
      reason: 'Different crop commodities'
    };
  }

  // 2. Price Fit (Weight: 30 pts)
  let priceScore = 0;
  const lotPrice = lot.price_expectation ? Number(lot.price_expectation) : null;
  const maxPrice = requirement.max_price ? Number(requirement.max_price) : null;

  if (lotPrice === null || maxPrice === null) {
    // Open offer or unspecified ceiling allows flexible negotiation
    priceScore = 26;
  } else if (lotPrice <= maxPrice) {
    // Within or below price ceiling: full 30 pts
    const savingsRatio = (maxPrice - lotPrice) / maxPrice;
    priceScore = Math.min(30, 26 + Math.round(savingsRatio * 4));
  } else {
    // Price exceeds ceiling: penalized proportionally
    const premiumRatio = (lotPrice - maxPrice) / maxPrice;
    if (premiumRatio <= 0.15) {
      priceScore = Math.max(10, Math.round(30 * (1 - premiumRatio * 4)));
    } else {
      priceScore = Math.max(0, Math.round(15 * (1 - premiumRatio * 2)));
    }
  }

  // 3. Reliability Placeholder (Weight: 25 pts)
  // Specified: Flat default score of 80 for now (80% of 25 = 20 pts)
  const reliabilityScore = Math.round(25 * (80 / 100)); // 20 pts

  // 4. Quantity Fit (Weight: 20 pts)
  const lotQty = Number(lot.quantity) || 1;
  const reqQty = Number(requirement.quantity_needed) || 1;
  const minQty = Math.min(lotQty, reqQty);
  const maxQty = Math.max(lotQty, reqQty);
  const qtyRatio = minQty / maxQty; // 0.0 to 1.0
  const quantityScore = Math.round(20 * qtyRatio);

  // 5. Location Match (Weight: 15 pts)
  let locationScore = 10; // Default state-level match (Maharashtra intra-state trade)
  const lotLoc = (lot.location || lot.farmers?.district || '').toLowerCase();
  const reqLoc = (requirement.quality_spec || '').toLowerCase(); // If buyer specified regional origin
  const farmerDistrict = (lot.farmers?.district || '').toLowerCase();

  if (lotLoc.includes('nashik') || lotLoc.includes('pune') || lotLoc.includes('nagpur') || lotLoc.includes('kolhapur')) {
    locationScore = 13;
  }
  if (farmerDistrict && reqLoc && reqLoc.includes(farmerDistrict)) {
    locationScore = 15;
  }

  // 6. Data Completeness (Weight: 10 pts)
  let completenessScore = 0;
  if (lot.grade) completenessScore += 3;
  if (lot.location) completenessScore += 2;
  if (lot.available_from) completenessScore += 2;
  if (requirement.quality_spec) completenessScore += 2;
  if (requirement.needed_by) completenessScore += 1;
  completenessScore = Math.min(10, completenessScore);

  // Total Score (0 - 100)
  const totalScore = Math.min(100, Math.max(0, priceScore + reliabilityScore + quantityScore + locationScore + completenessScore));

  // Synthesize Intuitive One-Line Reason
  let reason = '';
  if (totalScore >= 85) {
    if (lotPrice && maxPrice && lotPrice <= maxPrice) {
      reason = 'Strong price fit under budget ceiling, excellent volume match';
    } else {
      reason = 'High-compatibility match with verified grade and origin';
    }
  } else if (totalScore >= 70) {
    if (qtyRatio >= 0.7) {
      reason = 'Good quantity fulfillment with standard market grade';
    } else {
      reason = 'Competitive price spread; partial batch procurement';
    }
  } else if (totalScore >= 50) {
    if (lotPrice && maxPrice && lotPrice > maxPrice) {
      reason = 'Slightly above target price ceiling; open to counter-offer';
    } else {
      reason = 'Volume mismatch; partial lot fulfillment possible';
    }
  } else {
    reason = 'Basic commodity match; requires price and quantity adjustment';
  }

  return {
    score: totalScore,
    isMatch: totalScore >= 40,
    breakdown: {
      price: priceScore,
      reliability: reliabilityScore,
      quantity: quantityScore,
      location: locationScore,
      completeness: completenessScore
    },
    reason
  };
}

/**
 * Finds and ranks all active buyer requirements for a given produce lot
 */
export function findMatchesForLot(lot, requirementsList) {
  return requirementsList
    .map(req => {
      const match = calculateMatchScore(lot, req);
      return {
        lot,
        requirement: req,
        score: match.score,
        breakdown: match.breakdown,
        reason: match.reason
      };
    })
    .filter(m => m.score >= 40)
    .sort((a, b) => b.score - a.score);
}

/**
 * Finds and ranks all active produce lots for a given buyer requirement
 */
export function findMatchesForRequirement(requirement, lotsList) {
  return lotsList
    .map(lot => {
      const match = calculateMatchScore(lot, requirement);
      return {
        lot,
        requirement,
        score: match.score,
        breakdown: match.breakdown,
        reason: match.reason
      };
    })
    .filter(m => m.score >= 40)
    .sort((a, b) => b.score - a.score);
}

/**
 * Global bipartite matching across all active lots and requirements
 */
export function findAllMatches(lotsList, requirementsList) {
  const matches = [];
  for (const lot of lotsList) {
    for (const req of requirementsList) {
      const match = calculateMatchScore(lot, req);
      if (match.score >= 40) {
        matches.push({
          lot,
          requirement: req,
          score: match.score,
          breakdown: match.breakdown,
          reason: match.reason
        });
      }
    }
  }
  return matches.sort((a, b) => b.score - a.score);
}
