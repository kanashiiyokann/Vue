let util = {
  clone(data) {
    return JSON.parse(JSON.stringify(data));
  },
  /**
   * 合计数值
   */
  sum() {
    let scale = 0, total = 0, numbers = [];
    for (let arg of  arguments) {

      if (typeof arg !== 'number') {
        try {
          arg = parseFloat(arg);
        } catch (e) {
          console.error(e);
        }
      }
      numbers.push(arg);
      if (arg.toString().indexOf(".")>-1) {
        let arr = arg.toString().split(".")[1];
        scale = scale < arr.length ? arr.length : scale;
      }
    }
    scale = Math.pow(10, scale);
    for (let number of numbers) {
      total += number * scale;
    }
    return total / scale;

  }
};
export default util;
