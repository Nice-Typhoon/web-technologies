function minDigit(x) {
  if (x < 0 || !Number.isInteger(x)) {
    throw new Error('x должно быть неотрицательным целым числом');
  }

  let min = 9; 
  if (x === 0) return 0; 

  while (x > 0) {
    let digit = x % 10; 
    if (digit < min) {
      min = digit;
    }
    x = (x - digit) / 10; 
  }

  return min;
}

console.log(minDigit(48259));
console.log(minDigit(907));
console.log(minDigit(5));
console.log(minDigit(999));