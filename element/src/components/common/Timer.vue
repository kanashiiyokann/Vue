<template>
  <span>{{this.time}}</span>
</template>

<script>
    export default {
        name: "Timer",
        props:{time: {type: Number, required: true,default:60}},
        data() {
            return {timer: null}
        },
        methods: {
            countDown() {
                this.time--;
                if (this.time === 0 && this.timer !== null) {
                    window.clearInterval(timer);
                }
            },
            run() {
                this.timer = setInterval(this.countDown, 1000)
            }
        },
        mounted() {
            this.run();
        }
    }
</script>

<style scoped>

</style>
