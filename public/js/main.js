//pwa
/*
if ('serviceWorker' in navigator) {
   navigator.serviceWorker.register('/service.js')
   .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
   })
   .catch(error => {
      console.error('Service Worker registration failed:', error);
   });
} else {
   console.warn('Service Workers are not supported in this browser.');
}
*/
// retrieve data from Local Storage

function getStorageData(isFormatted = false) {
   let chatHistoryData = [{}];

   let key = isFormatted ? 'sessionFormattedChats': 'sessionChats';
   chatHistoryData = JSON.parse(localStorage.getItem(key));

   if (!Array.isArray(chatHistoryData) || typeof chatHistoryData[0] !== 'object') {
      chatHistoryData = [{}];
   }

   if (Object.keys(chatHistoryData[0]).length > 7) {
      Object.keys(chatHistoryData[0]).reverse().forEach((key, i) => {
         if (i > 6) {
            delete chatHistoryData[0][key]
         }
      })
      if (!isFormatted) {
         localStorage.setItem('sessionChats', JSON.stringify(chatHistoryData));
      } else {
         localStorage.setItem('sessionFormattedChats', JSON.stringify(chatHistoryData));
      }
   }

   return chatHistoryData;
}


// Initial setup
const responseDiv = document.getElementById('response');
let file;
let history = {};
let formattedText = {};

function loadNewChat() {
   drawer(1);
   responseDiv.replaceChildren();
   file = '#chat';
   // handle online/offline
   if (navigator.onLine === false) {
      // when no conversation happened && user is offline
      if (responseDiv.children.length === 0 || (responseDiv.children.length === 1 && responseDiv.children[0].className === "template")) {
         responseDiv.innerHTML = `<div class="template"><span class='highlight' style="color: #b8180b">Oops! You're offline. You can still access previous chats.</span><span class="blink" style="color: red">•</span></p></div>`;
      }
   } else {
      // when no conversation happened
      if (responseDiv.children.length === 0) {
         responseDiv.innerHTML = `<div class="template"><span class='highlight'>Ask me anything</span>, let's chat about anything you like, from <b>deep questions to silly jokes</b>.<p><span style='color: #0b6f66'>Start a conversation now</span><span class="blink">!</span></p></div>`
      }
   }

   history = {
      history: [],
      generationConfig: {
         maxOutputTokens: undefined,
      }
   }
   formattedText = {
      text: []
   }
   //localStorage.clear();
}

loadNewChat();

let drawervisibility = false;

// mobile drawer open/close
function drawer(state) {
   let drawer = document.getElementById("drawer");
   if (state === 1) {
      if (drawer.classList.contains('active')) {
         drawer.classList.remove('active');
         drawer.classList.add('inactive');
      }
   } else {
      drawer.classList.add('active');
      drawer.classList.remove('inactive');
   }
}

function scrollBottomChat() {
   try {
      if (responseDiv.children.length > 0) {
         responseDiv.scrollTop = responseDiv.scrollHeight - responseDiv.children[responseDiv.children.length - 1].offsetHeight;
      }
   } catch (e) {
      console.log(e)
   }
}

// prompt send button function
function btnState() {
   if (drawervisibility) {
      document.getElementById('sendBtn').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M16 7.328v-3.328l8 8-8 8v-3.328l-16-4.672z"/></svg>`;
      document.getElementById('sendBtn').classList.remove('wait');
      document.getElementById('sendBtn').disabled = false;
      drawervisibility = false;
   } else {
      document.getElementById('sendBtn').innerText = "•••";
      document.getElementById('sendBtn').classList.add('wait');
      document.getElementById('sendBtn').disabled = true;
      drawervisibility = true;
   }
}

// copy text
function copyToClipboard(text) {
   const textToCopy = text;

   // Create a temporary textarea element
   const tempTextArea = document.createElement('textarea');
   tempTextArea.value = textToCopy;
   document.body.appendChild(tempTextArea);
   tempTextArea.select();
   tempTextArea.setSelectionRange(0, 99999); // For mobile devices
   document.execCommand('copy');
   document.body.removeChild(tempTextArea);
}

//
function updateChatHistoryContainer() {
   try {
      let chatHistory = getStorageData();
      let formattedTextData = getStorageData(true);
      let historyContainer = document.getElementById('chatHistoryList');
      historyContainer.replaceChildren();
      for (const items in chatHistory[0]) {
         let itemDiv = document.createElement('div');
         itemDiv.innerText = items.replace(items.substr(items.indexOf(`(/file.`), items.length), '');
         itemDiv.addEventListener('click', (ev) => {
            loadFromChatHistory(items, chatHistory[0][items], formattedTextData[0][items]);
         });
         historyContainer.insertBefore(itemDiv, historyContainer.children[0]);
      }

      let itemNewDiv = document.createElement('div');
      itemNewDiv.innerText = '+ NEW CHAT';
      itemNewDiv.className = 'create';
      itemNewDiv.addEventListener('click', (ev) => {
         loadNewChat();
      });
      if (historyContainer.children.length !== 0) {
         historyContainer.insertBefore(itemNewDiv, historyContainer.children[0]);
      } else {
         historyContainer.appendChild(itemNewDiv);
      }
   } catch (e) {
      alert(e.message)
   }
}

function updateChatUsageContainer() {
   let TokenCount = JSON.parse(localStorage.getItem('usageData')) || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0
   }
   let {
      promptTokenCount,
      candidatesTokenCount,
      totalTokenCount
   } = TokenCount;
   let usageContainer = document.getElementById('botUsageList');
   usageContainer.innerHTML = `
   <div><strong>Prompt Token</strong>: ${promptTokenCount}</div>
   <div><strong>Candidates Token</strong>: ${candidatesTokenCount}</div>
   <div><strong>Total Token</strong>: ${totalTokenCount}</div>
   `;
}


// highlights code part & add code copy button in AI's response
function processCodeArea(text) {
   let dummyDiv = document.createElement('div');
   dummyDiv.innerHTML = text;

   for (let i = 0; i < dummyDiv.children.length; i++) {
      if (dummyDiv.children[i].tagName === "PRE") {
         let newCode = document.createElement('div');
         let codeHeader = document.createElement('div');
         codeHeader.className = "codeHeaders";

         let language = dummyDiv.children[i].children[0].className.split(' ');
         language = language[0].replace('language-', '');
         codeHeader.innerHTML = `<p>${language}</p><p>COPY CODE</p>`

         codeHeader.addEventListener('click', (ev) => {
            copyToClipboard(dummyDiv.children[i].children[1].children[0].innerText);
         });
         newCode.appendChild(codeHeader)
         newCode.appendChild(dummyDiv.children[i].cloneNode(true));

         dummyDiv.replaceChild(newCode, dummyDiv.children[i]);
      }
   }
   return dummyDiv;
}

// adding footer to response
function responseFooter(text) {
   let footerDiv = document.createElement('div');
   footerDiv.className = 'respFooter';

   let copyDiv = document.createElement('div');
   let reGenDiv = document.createElement('div');

   copyDiv.className = "copyResponse";
   copyDiv.id = "copyResponse";
   copyDiv.dataset.responseClean = text;
   copyDiv.innerHTML = `<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m6 18h-3c-.48 0-1-.379-1-1v-14c0-.481.38-1 1-1h14c.621 0 1 .522 1 1v3h3c.621 0 1 .522 1 1v14c0 .621-.522 1-1 1h-14c-.48 0-1-.379-1-1zm1.5-10.5v13h13v-13zm9-1.5v-2.5h-13v13h2.5v-9.5c0-.481.38-1 1-1z" fill-rule="nonzero"/></svg>`

   reGenDiv.className = "regenResponse";
   reGenDiv.id = "regenResponse";
   reGenDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M23 12c0 1.042-.154 2.045-.425 3h-2.101c.335-.94.526-1.947.526-3 0-4.962-4.037-9-9-9-1.706 0-3.296.484-4.655 1.314l1.858 2.686h-6.994l2.152-7 1.849 2.673c1.684-1.049 3.659-1.673 5.79-1.673 6.074 0 11 4.925 11 11zm-6.354 7.692c-1.357.826-2.944 1.308-4.646 1.308-4.962 0-9-4.038-9-9 0-1.053.191-2.06.525-3h-2.1c-.271.955-.425 1.958-.425 3 0 6.075 4.925 11 11 11 2.127 0 4.099-.621 5.78-1.667l1.853 2.667 2.152-6.989h-6.994l1.855 2.681z"/></svg>`;

   copyDiv.addEventListener('click', (ev) => {
      copyToClipboard(ev.currentTarget.dataset.responseClean);
   });

   reGenDiv.addEventListener('click', (ev) => {
      history['history'].splice(history['history'].length - 1, 1);
      formattedText['text'].splice(formattedText['text'].length - 1, 1)
      processInput(true);
   });

   footerDiv.appendChild(copyDiv)
   footerDiv.appendChild(reGenDiv);

   return footerDiv;
}

//function when response received
async function processInput(regenerate = false) {
   let userMessage = "";
   if (!regenerate) {
      userMessage = document.getElementById('userMessage').value.trim();
   } else {
      userMessage = history['history'][history['history'].length -1].parts[0]['text'];
   }
   if (userMessage === "") return false;
   // —— clear previous state
   document.getElementById('userMessage').value = "";
   document.querySelector('.inputInterface textarea').style.height = `calc((1.5em * 1) + 20px)`;
   document.querySelector('.inputInterface .expand').classList.remove('expanded');
   document.querySelector('.inputInterface .expand').classList.remove('active');

   if (!regenerate) {
      let userRespDiv = document.createElement('div');
      userRespDiv.innerText = userMessage;
      userRespDiv.className = 'userMsg';
      responseDiv.appendChild(userRespDiv);
   } else {
      responseDiv.lastChild.style.opacity = 0.5;
   }
   btnState();
   scrollBottomChat();

   fetch('http://localhost:3000/response',
      {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            prompt: userMessage,
            history: history
         })
      }).then(res => {
         if (res.ok) {
            return res.json();
         } else {
            return res.json().then(errData => {
               throw new Error(`Error: ${errData.error || 'Failed to respond'}`);
            });
         }
      }).then(data => {

         if (file === '#chat') {
            file = userMessage.length > 25 ? userMessage.substr(0, 25) + "...": userMessage.substr(0, userMessage.length);
            file += `(/file.${Math.floor(Math.random()*9999)}#)`;
         }

         if (!regenerate) {
            history['history'].push({
               role: "user",
               parts: [{
                  text: userMessage
               }]
            })
         } else {
            responseDiv.removeChild(responseDiv.lastChild);
         }

         history['history'].push({
            role: "model",
            parts: [{
               text: data.normalResponse
            }]
         })

         formattedText['text'].push(data.output);
         let chatHistoryFormatted = getStorageData(true);

         Object.assign(chatHistoryFormatted[0], {
            [file]: formattedText
         });

         let codeProcessed = processCodeArea(data.output);
         let aiRespDiv = document.createElement('div');
         aiRespDiv.appendChild(codeProcessed);
         aiRespDiv.appendChild(responseFooter(data.normalResponse));
         aiRespDiv.className = 'aiMsg';
         responseDiv.appendChild(aiRespDiv);

         btnState()
         hljs.highlightAll();

         let chatHistory = getStorageData();

         Object.assign(chatHistory[0], {
            [file]: history
         });

         let TokenCount = JSON.parse(localStorage.getItem('usageData')) || {
            promptTokenCount: 0,
            candidatesTokenCount: 0,
            totalTokenCount: 0
         }

         let {
            promptTokenCount,
            candidatesTokenCount,
            totalTokenCount
         } = TokenCount;

         promptTokenCount = promptTokenCount + data.usageMetadata['promptTokenCount'];
         candidatesTokenCount = candidatesTokenCount + data.usageMetadata['candidatesTokenCount'];
         totalTokenCount = totalTokenCount + data.usageMetadata['totalTokenCount'];

         let usage = {
            promptTokenCount,
            candidatesTokenCount,
            totalTokenCount
         }

         localStorage.setItem('usageData', JSON.stringify(usage));
         localStorage.setItem('sessionChats', JSON.stringify(chatHistory));
         localStorage.setItem('sessionFormattedChats', JSON.stringify(chatHistoryFormatted));

         updateChatHistoryContainer()
         updateChatUsageContainer()
         scrollBottomChat();
      }).catch(err => {
         responseDiv.innerHTML += `<div class="error">${err.message}</div>`
         if (!regenerate) {
            history['history'].push({
               role: "user",
               parts: [{
                  text: userMessage
               }]
            })
         }
         if (file === '#chat') {
            file = userMessage.length > 20 ? userMessage.substr(0, 20) + "...": userMessage.substr(0, userMessage.length);
            file += `(/file.${Math.floor(Math.random()*9999)}#)`;
         }

         let chatHistory = getStorageData();

         Object.assign(chatHistory[0], {
            [file]: history
         });
         localStorage.setItem('sessionChats', JSON.stringify(chatHistory));
         btnState()
      })


   if (document.getElementById('response').children[0].className === 'template') {
      responseDiv.removeChild(responseDiv.children[0]);
   }
}

// when user typed his input & clicked send
document.getElementById('sendBtn').addEventListener('click', (e) => {
   processInput();
});
document.getElementById('userMessage').addEventListener('keyup', (e) => {
   if (e.key === "Enter") {
      processInput();
   }
});

// prompt area expand function
document.getElementById('expBtn').addEventListener('click',
   (ev) => {
      if (document.querySelector('.inputInterface .expand').classList.contains('expanded')) {
         document.querySelector('.inputInterface textarea').style.height = `calc((1.5em * 3) + 20px)`;
         document.querySelector('.inputInterface .expand').classList.remove('expanded');
      } else {
         document.querySelector('.inputInterface textarea').style.height = `calc((1.5em * 12) + 20px)`;
         document.querySelector('.inputInterface .expand').classList.add('expanded');
      }
   })

document.querySelector('.inputInterface textarea').addEventListener('blur',
   (ev) => {
      if (ev.target.value.trim() === "") {
         if (!document.querySelector('.inputInterface .expand').classList.contains('expanded')) {
            document.querySelector('.inputInterface textarea').style.height = `calc((1.5em * 1) + 20px)`;
         }
      }
   })

document.querySelector('.inputInterface textarea').addEventListener('scroll',
   (ev) => {
      if (ev.target.scrollTop > 0) {
         if (!document.querySelector('.inputInterface .expand').classList.contains('active')) {
            document.querySelector('.inputInterface .expand').classList.add('active');
         }
      } else {
         if (document.querySelector('.inputInterface .expand').classList.contains('active')) {
            document.querySelector('.inputInterface .expand').classList.remove('active');
         }
      }
   })

document.querySelector('.inputInterface textarea').addEventListener('focus',
   (ev) => {
      if (!document.querySelector('.inputInterface .expand').classList.contains('expanded')) {
         document.querySelector('.inputInterface textarea').style.height = `calc((1.5em * 3) + 20px)`;
      }
   })

// Drawer Mobile Swipe Function
let drawerWidth = (85/ 100) * window.innerWidth;
let touchStartX = 0;
let touchEndX = 0;
if (window.innerWidth < 580) {
   document.querySelector('.drawer').addEventListener('touchstart', function(event) {
      touchStartX = event.changedTouches[0].screenX;
   });

   document.querySelector('.drawer').addEventListener('touchmove', function(event) {
      touchEndX = event.changedTouches[0].screenX;
      if ((touchStartX > touchEndX + drawerWidth/5) && document.querySelector('.drawer').classList.contains('active')) {
         document.querySelector('.drawer').classList.remove('active');
         document.querySelector('.drawer').classList.add('inactive');
      }
   });
}

//when user select a chat from history
function loadFromChatHistory(fileName, data, formattedTextData) {
   try {
      history = data;
      file = fileName;
      formattedText = formattedTextData;
      drawer(1);
      responseDiv.replaceChildren();
      let aiFormRespCount = 0;
      data['history'].forEach((values, i) => {
         if (values['role'] === "model") {
            let codeProcessed = processCodeArea(formattedTextData['text'][aiFormRespCount]);
            aiFormRespCount++
            let aiRespDiv = document.createElement('div');
            aiRespDiv.appendChild(codeProcessed);
            aiRespDiv.appendChild(responseFooter(values['parts'][0]['text']));
            aiRespDiv.className = 'aiMsg';
            responseDiv.appendChild(aiRespDiv);

         } else if (values['role'] === "user") {
            let userRespDiv = document.createElement('div');
            userRespDiv.innerText = values['parts'][0]['text'];
            userRespDiv.className = 'userMsg';
            responseDiv.appendChild(userRespDiv);
         }
      })
      scrollBottomChat()
      hljs.highlightAll();
   } catch (e) {
      alert(e.message)
   }
}

// chat History Display
document.getElementById('chathistory').addEventListener('click', (ev) => {
   ev.preventDefault;
   ev.currentTarget.dataset.togglestate = ev.currentTarget.dataset.togglestate === '⛬' ? '⛌': '⛬';
   let historyContainer = document.getElementById('chatHistoryList');
   historyContainer.replaceChildren();
   historyContainer.classList.toggle('visibile');
   updateChatHistoryContainer()
}, true);

// chat Usage Display

document.getElementById('usagehistory').addEventListener('click', (ev) => {
   ev.preventDefault;
   ev.currentTarget.dataset.togglestate = ev.currentTarget.dataset.togglestate === '⛬' ? '⛌': '⛬'
   let usageContainer = document.getElementById('botUsageList');
   usageContainer.classList.toggle('visibile');
   updateChatUsageContainer();
}, true);