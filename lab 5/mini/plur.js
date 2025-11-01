function pluralizeRecords(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("n должно быть неотрицательным целым числом");
  }

  let wordForm;

  if (n % 10 === 1 && n % 100 !== 11) {
    wordForm = "запись";
  } else if (
    n % 10 >= 2 &&
    n % 10 <= 4 &&
    (n % 100 < 10 || n % 100 >= 20)
  ) {
    wordForm = "записи";
  } else {
    wordForm = "записей";
  }

  return `В результате выполнения запроса было найдено ${n} ${wordForm}`;
}

console.log(pluralizeRecords(1));   
console.log(pluralizeRecords(2));
console.log(pluralizeRecords(5));
console.log(pluralizeRecords(21));
console.log(pluralizeRecords(121));