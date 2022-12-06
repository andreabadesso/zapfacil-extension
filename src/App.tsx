import React from 'react';
import './App.css';
import { DOMMessage, DOMMessageResponse } from './types';

function App() {
  const [chats, setChats] = React.useState([]);
  const [loadingChats, setLoadingChats] = React.useState(false);
  const [loadingRemoving, setLoadingRemoving] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState('potentialList');

  const sendMessage = (type: string, data?: any): Promise<DOMMessageResponse> => {
    return new Promise((resolve) => {

      /**
       * We can't use "chrome.runtime.sendMessage" for sending messages from React.
       * For sending messages from React we need to specify which tab to send it to.
       */
      chrome.tabs && chrome.tabs.query({
        active: true,
        currentWindow: true
      }, tabs => {
        /**
         * Sends a single message to the content script(s) in the specified tab,
         * with an optional callback to run when a response is sent back.
         *
         * The runtime.onMessage event is fired in each content script running
         * in the specified tab for the current extension.
         */
        chrome.tabs.sendMessage(
          tabs[0].id || 0,
          { type, data } as DOMMessage,
          (response: DOMMessageResponse) => {
            resolve(response)
          });
      });
    });
  };

  const loadChats = React.useCallback(() => {
    setLoadingChats(true);
    sendMessage('LOAD_CHATS')
      .then(({ data }) => {
        setLoadingChats(false);
        setChats(data[selectedTab]);
      });
  }, [setChats, selectedTab]);

  const removeChats = React.useCallback(() => {
    setLoadingRemoving(true);

    sendMessage('REMOVE_CHATS', chats)
      .then(() => {
        // We need to give some time for the zapfacil screen to update
        setTimeout(() => {
          setLoadingRemoving(false);
          loadChats();
        }, 1000);
      })
  }, [loadChats, chats]);

  const handleSelectChange = React.useCallback((e) => {
    setSelectedTab(e.target.value);
    setChats([]);
  }, [setSelectedTab, setChats]);
  
  return (
    <div className="App">
      <div className="title-wrapper">
        <img className="logo" src="https://zapfacil-s3.s3.us-west-2.amazonaws.com/Assets/dev//8991d765-62ac-4dd8-8f84-8ef8675ae66918bbc5a0-bc20-4756-8ef6-e3387b7048f5logo_null_JP3CFt.png" alt="" />
        <h1>SuperFrete - ZapFacil Tools</h1>
      </div>

      <div className="options-menu">
        <select value={selectedTab} onChange={handleSelectChange} className="tab-select">
          <option value="potentialList">Potencial</option>
          <option value="pendingList">Pendente</option>
        </select>

        <button className="btn clean-btn" onClick={loadChats}>
          Carregar
        </button>

        {
          chats.length > 0 && !loadingRemoving && (
            <button className="btn remove-all" onClick={removeChats}>
              Remover todos
            </button>
          )
        }

        {
          loadingRemoving && (
            <button className="btn remove-all loading">
              Removendo...
            </button>
          )
        }
      </div>

      { loadingChats && (
        <p>Carregando...</p>
      )}

      { !loadingChats && chats.length > 0 && (
          <ul className="remove-item-list">
            {
              chats.map((chat) => (
                <li className="remove-item">
                  <div className="remove-item-content-wrapper">
                    <div className="remove-item-left">
                      <div className="ball"></div>
                    </div>
                    <div className="remove-item-right">
                      {/* @ts-ignore */}
                      <p className="remove-item-leadname">{chat.leadName}</p>
                      {/* @ts-ignore */}
                      <p className="remove-item-number">{chat.leadContact}</p>
                    </div>
                  </div>
                </li>
              ))
            }
          </ul>
        )
      }
    </div>
  );
}

export default App;
