// Gambi to force craco to build this as a module:
import { DOMMessage, } from './types';

/**
 * Capture the vuex store from the global vue object and fetch
 * the chat/getQueueWaiting key. I'm not very used to Vue/Vuex,
 * so there might be a better way to do this.
 */
// @ts-ignore
const vue = document.querySelectorAll('#white-label')[0].__vue__;
const pendingList = vue.$store.getters['chat/getQueueWaiting'];
const potentialList = vue.$store.getters['chat/getQueuePotential'];

/**
 * Post the list back to the content script
 */
window.postMessage({
  type: 'from-injected-script',
  data: {
    pendingList,
    potentialList,
  },
}, '*');
