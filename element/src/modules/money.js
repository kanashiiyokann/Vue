const regex = {money: /^-?(?!-0[0-9]+)(?!0[0-9]+)[0-9]+(\.[0-9]+)?$/};
export default function (money) {
 let obj = money || 0;
  obj=obj.toString().trim();
  if (!obj.match(regex.money)) {
    console.error(money + "不能正确转换成金额!");
  }
  obj=obj.split(".");


};
