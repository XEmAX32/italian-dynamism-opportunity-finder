import React, { useState, useEffect, useRef } from "react";
import './Index.css'
import Message from "../../components/Message/Message";
import Card from '../../components/Card/Card';

type message = {
  content: string,
  type: string,
  extras: object
}

const Index = () => {
  const [query, setQuery] = useState<string>('');
  const [width, setWidth] = useState<number>()
  const [height, setHeight] = useState<number>(20);
  const [messages, setMessages] = useState<message[]>([]);
  const [infoVisible, setInfoVisible] = useState<Boolean>(false);
  // const [messages, setMessages] = useState<message[]>([{type:'assistant', content: 'hellooooooo'}, {type:'user', content: 'hellooooooo'}]);
  // const responseRef = useRef("");
  // const [currentMsg, setCurrentMsg] = useState("");
  const socket = useRef();
  const isReadingOpportunity = useRef(false);
  const readingOpportunity = useRef();
  const { innerWidth: realWidth, innerHeight: realHeight } = window;

  const historyStyle = realWidth < 600 ? { height } : { width: realWidth - width };
  const chatStyle = realWidth < 600 ? { height: realHeight - height } : { width };

  useEffect(() => {
    if(!socket.current) {
      // socket.current = new WebSocket("wss://backend-9.deno.dev/wss");
      socket.current = new WebSocket("ws://localhost:8000/wss");
      
      console.log('SETUP')
      socket.current.addEventListener('message', (currentMsg) => {
        console.log('msgs',messages)
        // console.log('curr',currentMsg)
        // responseRef.current = responseRef.current += currentMsg.data
        // setCurrentMsg((msg) => {
        //   console.log('yo', responseRef.current)
        //   return msg += currentMsg.data;
        // })
        console.log('received msg', currentMsg.data)

        if(["```", "``"].includes(currentMsg.data) && (isReadingOpportunity.current && readingOpportunity.current.length > 0)) {
          isReadingOpportunity.current = false;
          console.log('opportunity', readingOpportunity.current)
          
          setMessages((msgs) => {
            let newMessageList = [...msgs];
            let _msg = Object.assign({}, newMessageList[newMessageList.length - 1]);

            _msg.extras = JSON.parse(readingOpportunity.current.replace('undefined', '').replace('`', '')).opportunities;

            newMessageList[newMessageList.length - 1] = _msg;

            return newMessageList;
          })


        }

        if(["```", "``"].includes(currentMsg.data) && !isReadingOpportunity.current)
          isReadingOpportunity.current = true;

        if(["```", "``", "`", "json"].includes(currentMsg.data))
          return;

        if(isReadingOpportunity.current) {
          console.log('readingopp', currentMsg.data, currentMsg.data.replace(/\r?\n|\r/g, " "))
          readingOpportunity.current += currentMsg.data.replace(/\r?\n|\r/g, " ");
        }else
          setMessages((msgs) => {
            let newMessageList = [...msgs];
            
            console.log('storing msg', currentMsg.data)
            if(msgs.length == 0 || msgs[msgs.length - 1]?.type == 'user')
              newMessageList.push({ role: 'assistant', content: '', extras: '' });

            let _msg = Object.assign({}, newMessageList[newMessageList.length - 1]);
            _msg.content += currentMsg.data;

            newMessageList[newMessageList.length - 1] = _msg;

            return newMessageList;
          })
      })
    }
  }, []);

          //   return newMessageList.map((msg, index) => {
        //     console.log('mapping', msg)

        //     let _msg = Object.assign({}, msg);
        //     console.log('skrt', _msg)

        //     if (index == newMessageList.length - 1) 
        //       _msg.content += currentMsg.data
            
        //     console.log(_msg);
        //     return _msg;
        //   })

      //   setMessages((msgs) => {
      //     console.log('cmsg', currentMsg.data, 'stream', streaming.current)
      //     var newMessageList = [...msgs];

      //     if (currentMsg.data.includes('EOF')) {
      //       console.log('OooOOOOOOOOOO')
      //       streaming.current = false;
      //       return newMessageList;
      //     }
    
      //     if (!streaming.current) {
      //       streaming.current = true;
      //       newMessageList.push({ role: 'assistant', content: '' });
      //     }

      //     console.log('stream', streaming.current, 'newlist', newMessageList)
    
      //     return newMessageList.map((msg, index) => {
      //       console.log('mapping', msg)

      //       let _msg = Object.assign({}, msg);
      //       console.log('skrt', _msg)

      //       if (index == newMessageList.length - 1) 
      //         _msg.content += currentMsg.data
            
      //       console.log(_msg);
      //       return _msg;
      //     })
      //   })
  //     }); 
  //   }
  // }, []);

        // if (currentMsg.data == 'EOF') {
        //   setMessages((msgs) => [...msgs, { role: 'assistant', content: responseRef.current }]);
        //   responseRef.current = "";
        //   setCurrentMsg(responseRef.current)
        // } else {
        //   responseRef.current = responseRef.current += currentMsg.data
        // }
      

  const handleInput = (event) => { setQuery(event.target.value) };

  const submitInput = () => {
    if(query.length < 2)
      return;

    setMessages((msg) => [...msg, {content: query, type: 'user'}])
    setQuery('')

    if(socket.current) 
      socket.current.send(query);
  }

  const onMouseDown = (event) => {
    console.log(event)
    document.onmouseup = stopDrag;
    document.onmousemove = drag;
    document.body.classList.add("noselect");
  }

  const drag = (event) => {
    if(realWidth < 600) {
      if(event.clientY < realHeight - 20 && event.clientY > 20)
        setHeight(event.clientY)
    } else
      setWidth(event.clientX)
  };

  const stopDrag = () => {
    document.onmouseup = null;
    document.onmousemove = null;
    document.body.classList.remove("noselect");
  }

  return (
    <div className="container">
      <div className="chatContainer" style={chatStyle}>
        <div className="messagesListContainer">
          { messages.map((message, index) => {
            return <Message _content={message.content} type={message.type} extras={message.extras} key={index} />;
          }) }
        </div>
        <div className="interactionContainer">
          {/* {realWidth < 600 && <div onClick={() => setInfoVisible(true)} className="infoBtn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" width="30px" height="30px">
              <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </div>} */}
          <div className="interactionBar magicBorder">
            <input 
              type="text" 
              className="searchInput" 
              placeholder="What's your next step?" 
              onChange={handleInput}
              value={query} />
            <button onClick={submitInput}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" width="20px" height="20px" >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <span style={{color: '#c8c8c8', fontSize: "10px"}}>This is more an alpha than a beta, things are supposed to break.</span>
        </div>
      </div>
      {/* {realWidth > 600 ? (<><div 
        className="draggableSeparator" 
        onMouseDown={onMouseDown}
      >
        <div className="draggableSeparatorIcon" >
          <svg xmlns="http://www.w3.org/2000/svg" color="white" width="2em" height="2em" viewBox="0 0 24 24"><path fill="currentColor" d="M6.45 17.45L1 12l5.45-5.45l1.41 1.41L4.83 11h14.34l-3.03-3.04l1.41-1.41L23 12l-5.45 5.45l-1.41-1.41L19.17 13H4.83l3.03 3.04z"/></svg>
        </div>
      </div>
      <div className="historyContainer" style={historyStyle}>
          <h1>Route42</h1>
          <h2>Your personal talent manager.</h2><br/><br/>
          <p>Welcome to Route42 public beta, get personalized suggestions on fellowships, grants, scholarships and much more.</p>
          <p>Currently there are <strong>171</strong> cool opportunities listed.</p>
          <br />
          <div className="formContainer">
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSdXrYOfCeBCMsl2Uete3QTf937enrqSc8_mR3SxqcEQix93hA/viewform?embedded=true" width={realWidth * 0.8} height="100%" frameborder="0" marginheight="0" marginwidth="0">Caricamento…</iframe>
          </div>
      </div></>) : <>
        <div className="historyContainer" style={{ zIndex: 9999, display: infoVisible ? 'block' : 'none' }}>
          <div className="closeBtn" onClick={() => setInfoVisible(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" width="30px" height="30px">
              <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1>Route42</h1>
          <h2>Your personal talent manager.</h2><br/><br/>
          <p>Welcome to Route42 public beta, get personalized suggestions on fellowships, grants, scholarships and much more.</p>
          <p>Currently there are <strong>171</strong> cool opportunities listed.</p>
          <br />
          <div className="formContainer">
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSdXrYOfCeBCMsl2Uete3QTf937enrqSc8_mR3SxqcEQix93hA/viewform?embedded=true" width={realWidth * 0.8} height="100%" frameborder="0" marginheight="0" marginwidth="0">Caricamento…</iframe>
          </div>
        </div>
      </>} */}
    </div>
  )
};

export default Index;