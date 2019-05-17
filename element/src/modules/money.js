const regex = {money: /^-?(?!-0[0-9]+)(?!0[0-9]+)[0-9]+(\.[0-9]+)?$/};
Money.prototype.precsion=2;
 function Money (money) {
 let obj = money || 0;
 let numerical,scale=1;
  obj=obj.toString().trim();
  if (!obj.match(regex.money)) {
    console.error(money + "不能正确转换成金额!");
  }
    numerical=obj.replace(".","");
  if(obj.indexOf(".")>-1){

  }

  this.value=function(){

    return
  }

}

