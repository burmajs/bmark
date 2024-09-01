const aa = (text: string) => {
  text = `world ${text}`;
  text = `Hello ${text}`;
  return text;
};
const bb = (text: string) => {
  const t1 = `world ${text}`;
  const t2 = `Hello ${t1}`;
  return t2;
};

console.log(aa("Joe"));
console.log(bb("Joe"));
