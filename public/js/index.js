import OneVsOneOverlayComponent from "./components/one-vs-one-overlay.js";
import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
// import "./utils/data-injector.js";

window.overlay = {};
/*
new OneVsOneOverlay(
    new Scoresaber(),
);*/

const app = createApp(OneVsOneOverlayComponent);
app.config.globalProperties.overlay = {};
window.overlay = app.config.globalProperties.overlay;
app.mount('#app');
