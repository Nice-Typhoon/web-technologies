function pow(x, n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('n должно быть натуральным');
  }

  let result = 1;
  for (let i = 0; i < n; i++) {
    result *= x;
  }
  return result;
}

console.log(pow(2, 3));
console.log(pow(5, 1));
console.log(pow(-3, 4));
