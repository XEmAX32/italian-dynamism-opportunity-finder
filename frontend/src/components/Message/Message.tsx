import React, { useState, useEffect } from "react";
import './Message.css';
import Card from '../Card/Card.tsx';

const types = {
  'DEFAULT': 'assistant'
}

const Message = ({_content, type = types['DEFAULT'], extras = [], ...props}) => {
  console.log('extra', extras);

  return (
    <>
      <div className="messageContainer" style={{textAlign: type == types['DEFAULT'] ? "left" : "right"}}>
        <span className="messageSender">{type == types['DEFAULT'] ? "Route42" : 'You'}</span><br />
        <span className="messageContent">{_content}</span>
      </div>
      {extras.length > 0 && (extras.map((extra: any) => <Card title={extra?.title} description={extra?.description} link={extra?.link} />))}
    </>
  )
}

export default Message;