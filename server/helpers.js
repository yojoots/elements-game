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

module.exports = { colorFromElement, colorifyString, hashCode, letterToElement };
