function colorFromElement(element) {
    if (element === "air") {
        return "gray"
    } else if (element === "earth") {
        return "#332019"
    } else if (element === "fire") {
        return "red"
    } else if (element === "water") {
        return "blue"
    } else {
        return "black"
    }
};

module.exports = { colorFromElement };
