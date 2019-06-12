/**
 * 页面缓存器，缓存固定url请求的数据
 */
function Cacher() {
  this.ajax = function (options) {
    let target = '';
    let param = options.data || null;
    if (param !== null) {
      for (let key in param) {
        if (param.hasOwnProperty(key)) {
          target += ("&" + key + "=" + param[key]);
        }
      }
      target = '?' + target.substring(1);
    }
    target = options.url + target;
    let data = JSON.parse(sessionStorage.getItem(target));
    let resolve = options.success;
    if (typeof resolve !== "function") {
      console.error("success in option must be function!");
    }
    if (data !== null) {
      resolve(data);
    } else {
      options.success = function (res) {
        let ret = resolve(res);
        if (ret !== false) sessionStorage.setItem(target, JSON.stringify(res));
      };
      sendHttpRequest(options);
    }
  };

  /**
   * 发送http请求
   * @param options ajax请求参数
   */
  function sendHttpRequest(options) {

    let defaults = {
      url: null,
      type: "POST",
      async: true,
      success: function (data) {
        console.log(data);
      },
      error: function (args) {
        console.error(args);
      }
    };
    defaults = extend(defaults, options);

    if (!XMLHttpRequest) {
      console.error("当前浏览器版本过低,不支持XMLHttpRequest!");
    }
    let xhr = new XMLHttpRequest();
    xhr.open(defaults.type, defaults.url, defaults.async);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 304)) {
        defaults.success().call(this, xhr.responseText);
      } else {
        defaults.error(arguments);
      }
    };
    xhr.send(data);
  }

  /**
   *  合并数据对象
   * @param obj
   * @param obj2
   * @returns {*}
   */
  function extend(obj, obj2) {
    if (typeof obj2 === 'object') {
      for (let key in obj2) {
        obj[key] = obj2[key];
      }
    }
    return obj;
  }
}

let cacher = new Cacher();
window.$cacher = cacher;

export {cacher} ;


