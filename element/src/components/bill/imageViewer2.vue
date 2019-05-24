<template>
  <div>
    <div v-viewer2 ref="body" class="body" style="margin: 50px;">
      <div class="container">
        <img alt="" :src="data" class="image">
      </div>
      <div class="actionBar"></div>
    </div>
  </div>
</template>

<script>


  export default {
    name: 'imageViewer2',
    props: {
      data: {type: String, required: true},
      width: {type: Number, default: 720},
      height: {type: Number, default: 420}
    },
    data() {
      return {};
    },
    mounted() {
      //初始化大小
      let $body = this.$refs.body;
      let $container = $body.getElementsByClassName("container")[0];
      let $image = $container.getElementsByClassName("image")[0];
      let $actionBar = $container.getElementsByClassName("actionBar")[0];
      $container.style.width = this.width + 'px';
      $container.style.height = this.height + 'px';

      //自适应大小,居中
      $image.addEventListener('load', function () {
        let rate_container = $container.clientWidth / $container.clientHeight;
        let rate_image = $image.naturalWidth / $image.naturalHeight;
        if (rate_image > rate_container) {
          $image.style.width = $container.clientWidth + 'px';
          let height = $image.naturalHeight / $image.naturalWidth * $container.clientWidth;
          $image.style.height = height + 'px';
          $image.style.top = ($container.clientHeight - height) / 2 + 'px';
        } else {
          $image.style.height = $container.clientHeight + 'px';
          let width = $image.naturalWidth / $image.naturalHeight * $container.clientHeight;
          $image.style.width = width + 'px';
          $image.style.left = ($container.clientWidth - width) / 2 + 'px';
        }

      });
    },
    directives: {
      viewer2: {
        bind(el) {
          //组件元素
          let $image = $(".image");
          let $container = $(".container");

          //鼠标事件
          /**
           *  鼠标按下
           * */
          $image.addEventListener('mousedown', function (e) {
            e.preventDefault();
          });

          /**鼠标移动 */
          $image.addEventListener('mousemove', dragImage);

          $container.addEventListener('mousewheel', scaleImage);

          /**
           * 图片拖动定位
           */
          function dragImage(e) {
            //which等于1表示左键按下
            if (e.which === 1) {
              //判断鼠标是否在image范围内
              $image.style.top = parseFloat($image.style.top || 0) + e.movementY + 'px';
              $image.style.left = parseFloat($image.style.left || 0) + e.movementX + 'px';
            }
            e.preventDefault();

          }

          /**
           * 图片放大
           */
          function scaleImage(e) {

            let delta = e.wheelDelta || 0;
            if (delta) {

              let rate = 1 + delta / Math.abs(delta) * 0.1;
              rate = rate.toFixed(2);

              $image.style.width = $image.clientWidth * rate + 'px';
              $image.style.height = $image.clientHeight * rate + 'px';
              // $image.style.top = parseFloat($image.style.top || 0) * rate + 'px';
              // $image.style.left = parseFloat($image.style.left || 0) * rate + 'px';

            }
            e.preventDefault();
          }

          /**
           *选择元素
           * @param selector
           * @returns {Element | any}
           */
          function $(selector) {
            return el.querySelector(selector);
          }
        }
      }
    }
  }
</script>

<style scoped>

  div {
    display: inline-block;
  }

  .image {
    display: block;
    height: 100%;
    position: absolute;
  }

  .container {
    position: relative;
    z-index: 100;
    overflow: hidden;
    border: 1px solid red;
  }

</style>
