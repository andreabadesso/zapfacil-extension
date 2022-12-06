/**
 * This is the content script that runs in the same context of the ZapFacil UI,
 * it can interact with the document and window object and also communicate (by
 * message passing) with the popup script.
 */

import {
  DOMMessage,
  DOMMessageResponse,
} from '../types';

const MIN_RANDOM = 1000; // Min 1s to wait between server calls
const MAX_RANDOM = 3000;

/**
 * This will call the finished-dialog API from ZapFacil
 */
const removeChat = async (token: string, chat: any): Promise<void> => {
  const payload = JSON.stringify({
    protocol: chat.protocol,
    contact: chat.leadContact,
    botToken: chat.botToken,
  });
  const requestOptions = {
    method: 'PUT',
    mode: 'cors',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: payload,
  };

  // @ts-ignore
  const response = await fetch('https://api.painel.zapfacil.com/api/dialogLeads/finished-dialog', requestOptions);
};

/**
 * A JWT token is stored as a cookie on the browser, this method fetches it.
 *
 * This is an example with random values but correct keys:
 * ```json
 * {
 *    "unique_name": "User Name",
 *    "role": "UserRole",
 *    "primarysid": "228",
 *    "certserialnumber": "1999-1888-1929-aef1-c1a211e1df17",
 *    "authmethod": "JWT",
 *    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/country": "Invariant Country",
 *    "groupsid": "1111",
 *    "nbf": 1669141111,
 *    "exp": 1669231111,
 *    "iat": 1669141111,
 *    "iss": "zapfacil-api",
 *    "aud": "zapfacil-clients"
 *  }
 *  ```
 */
const getToken = () => {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('zapfacil_token='))
    ?.split('=')[1] as string;
}

const sleep = async (milliseconds: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, milliseconds)
  });
};

const handleMessage = async (type: string, data?: any): Promise<DOMMessageResponse> => {
  if (type === 'GET_TOKEN') {
    const token = getToken();

    const response: DOMMessageResponse = {
      data: token,
    };

    return Promise.resolve(response);
  } else if (type === 'REMOVE_CHATS') {
    for (const chat of data) {
      await removeChat(getToken(), chat);
      const randomSleepTime = Math.ceil(Math.random() * (MAX_RANDOM - MIN_RANDOM + 1) + MIN_RANDOM)
      console.log(`Sleeping for ${randomSleepTime}ms`);
      await sleep(randomSleepTime);
    }

    const response: DOMMessageResponse = {
      data: true,
    };

    return Promise.resolve(response);
  }

  // type === LOAD_CHATS
  return new Promise((resolve, reject) => {
    /**
     * I wasn't able to get the vue object from this content script, so this is a 
     * gambi I came up with, I'm injecting a script on the ZapFacil UI that gets
     * the potential list from the Vuex store (described in src/inject.ts) and sends
     * back a message (using window.postMessage) so we can use it here. Ugly as hell,
     * but its working
     */
    const eventListener = (event: any) => {
      if (event.data.type === 'from-injected-script') {
        const {
          potentialList,
          pendingList,
        } = event.data.data;

        const response: DOMMessageResponse = {
          data: {
            potentialList,
            pendingList,
          }
        };

        resolve(response);

        // Cleanup the event listener
        window.removeEventListener('message', eventListener);
      }
    };

    window.addEventListener('message', eventListener);

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('static/js/inject.js');
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  });
};

const messagesFromReactAppListener = (
  msg: DOMMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: DOMMessageResponse) => void,
) => {
  handleMessage(msg.type, msg.data)
    .then((response: DOMMessageResponse) => {
      sendResponse(response);
    })

  // return true so chrome knows we will async send a response
  return true;
};

/**
 * Fired when a message is sent from either an extension process
 * or a content script.
 */
chrome.runtime.onMessage.addListener(messagesFromReactAppListener);

