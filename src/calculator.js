const add = (a, b) => Number(a) + Number(b);

const subtract = (a, b) => Number(a) - Number(b);

const multiply = (a, b) => Number(a) * Number(b);

const divide = (a, b) => {
  if (Number(b) === 0) {
    throw new Error("division par zéro.");
  }
  return Number(a) / Number(b);
};

module.exports = { add, subtract, multiply, divide };