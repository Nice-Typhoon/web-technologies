function gcd(a, b) {
  if (a < 0 || b < 0 || !Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error('a и b должны быть неотрицательными целыми числами');
  }

  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

console.log(gcd(12, 8));
console.log(gcd(100, 25));
console.log(gcd(7, 3));