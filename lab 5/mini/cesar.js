function cesar(str, shift, action) {
  const alphabetLower = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  const alphabetUpper = alphabetLower.toUpperCase();
  const len = alphabetLower.length;

  shift = ((shift % len) + len) % len;

  if (action === 'decode') shift = -shift;

  let result = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    let index;

    if ((index = alphabetLower.indexOf(ch)) !== -1) {
      let newIndex = (index + shift + len) % len;
      result += alphabetLower[newIndex];
    } else if ((index = alphabetUpper.indexOf(ch)) !== -1) {
      let newIndex = (index + shift + len) % len;
      result += alphabetUpper[newIndex];
    } else {
      result += ch;
    }
  }

  return result;
}

console.log(cesar("привет", 3, "encode"));
console.log(cesar("тулезх", 3, "decode")); 

console.log(cesar("эзтыхз фзъзъз", 8, "decode")); 