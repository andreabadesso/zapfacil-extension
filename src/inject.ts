import {
  DOMMessage,
} from './types';

// @ts-ignore
const vue = document.querySelectorAll('#white-label')[0].__vue__;
const potentialList = vue.$store.getters['chat/getQueueWaiting'];

window.postMessage({
  type: 'from-injected-script',
  data: potentialList,
}, '*');
