function fibb(n) {
  if (!Number.isInteger(n) || n < 0 || n > 1000) {
    throw new Error("n должно быть целым неотрицательным числом, не больше 1000");
  }

  if (n === 0 || n === 1) return n;

  let a = 0, b = 1, next;

  for (let i = 2; i <= n; i++) {
    next = a + b;
    a = b;
    b = next;
  }

  return b;
}

console.log(fibb(0)); 
console.log(fibb(1)); 
console.log(fibb(5)); 
console.log(fibb(10));