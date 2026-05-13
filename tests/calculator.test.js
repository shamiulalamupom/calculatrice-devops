const { add, subtract, multiply, divide } = require('../src/calculator');

test('addition', () => {
    expect(add(2, 3)).toBe(5);
})

test('soustraction', () => {
    expect(subtract(5, 3)).toBe(3);
})

test('multiplication', () => {
    expect(multiply(5, 2)).toBe(10);
})

test('division', () => {
    expect(divide(10, 2)).toBe(5);
})

test('division par zéro', () => {
    expect(() => divide(10, 0)).toThrow();
})