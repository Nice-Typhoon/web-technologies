function getSortedArray(array, key) {
  if (!Array.isArray(array)) {
    throw new Error("первый параметр должен быть массивом объектов");
  }
  if (typeof key !== "string") {
    throw new Error("второй параметр должен быть ключом сортировки");
  }

  let sortedArray = [];
  for (let i = 0; i < array.length; i++) {
    sortedArray[i] = array[i];
  }

  for (let i = 0; i < sortedArray.length - 1; i++) {
    for (let j = 0; j < sortedArray.length - i - 1; j++) {
      let a = sortedArray[j][key];
      let b = sortedArray[j + 1][key];

      if (a > b) {
        let temp = sortedArray[j];
        sortedArray[j] = sortedArray[j + 1];
        sortedArray[j + 1] = temp;
      }
    }
  }

  return sortedArray;
}

const data = [
  { name: "Иван", age: 25 },
  { name: "Петр", age: 19 },
  { name: "Алексей", age: 30 },
  { name: "Борис", age: 22 }
];

console.log(getSortedArray(data, "age"));
console.log(getSortedArray(data, "name"));