function colorFromElement(element) {
    if (element === "air") {
        return "gray"
    } else if (element === "earth") {
        return "brown"
    } else if (element === "fire") {
        return "red"
    } else if (element === "water") {
        return "blue"
    } else {
        return "black"
    }
};

const colorifyString = (str) => {
    let hash = 0;
    str.split('').forEach(char => {
      hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      color += value.toString(16).padStart(2, '0')
    }
    return color;
};

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

function letterToElement(letter) {
  if (letter === "a") {
      return "air"
  } else if (letter === "e") {
      return "earth"
  } else if (letter === "f") {
      return "fire"
  } else if (letter === "w") {
      return "water"
  } else {
      return "neutral"
  }
}

function hashCode(string){
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
      var code = string.charCodeAt(i);
      hash = ((hash<<5)-hash)+code;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

module.exports = { calculateVisualCircles, colorFromElement, colorifyString, hashCode, letterToElement };
