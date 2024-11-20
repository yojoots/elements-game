function calculateVisualCircles(totalCount) {
  // Base case for small numbers
  if (totalCount <= 2) {
    return {
      radius: 20,
      count: totalCount
    };
  }

  // Using logarithmic scaling for both radius and count
  // Log base 4 gives us a nice gradual increase
  const baseRadius = 20;
  const maxRadius = 40;
  const minCount = 3;
  const maxCount = 15;

  // Calculate radius
  // As count increases, radius gradually increases up to maxRadius
  const radiusScale = Math.min(1 + Math.log(totalCount) / 10, 2);
  const radius = Math.min(baseRadius * radiusScale, maxRadius);

  // Calculate visual count
  // Use log base 4 to reduce the number of circles more aggressively
  const logBase = 4;
  const suggestedCount = Math.max(
    minCount,
    Math.min(
      Math.round(Math.log(totalCount) / Math.log(logBase) * 2),
      maxCount
    )
  );

  return {
    radius: Math.round(radius),
    count: suggestedCount
  };
}

module.exports = { calculateVisualCircles };
