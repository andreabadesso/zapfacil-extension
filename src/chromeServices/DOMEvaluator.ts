import {
  DOMMessage,
  DOMMessageResponse,
} from '../types';

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

const getToken = () => {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('zapfacil_token='))
    ?.split('=')[1] as string;
}

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
    }

    const response: DOMMessageResponse = {
      data: true,
    };

    return Promise.resolve(response);
  }

  return new Promise((resolve, reject) => {
    const eventListener = (event: any) => {
      if (event.data.type === 'from-injected-script') {
        const potentialList = event.data.data;

        const response: DOMMessageResponse = {
          data: potentialList,
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

  return true;
};

/**
 * Fired when a message is sent from either an extension process
 * or a content script.
 */
chrome.runtime.onMessage.addListener(messagesFromReactAppListener);

