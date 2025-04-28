import React, { useState, useEffect } from "react";
import './Card.css';
import { useNavigate } from 'react-router-dom';
import Picture from "../Picture/Picture";

const Message = ({title, description, link, image}, ...props) => {
  
  const navigate = useNavigate();

  return (
    <div className="cardContainer magicBorder" {...props} onClick={() => navigate('/d/' + link)}>
      <Picture image={image} title={title} />
      <div className="cardContent">
        <div>
          <div className="cardTitle">{title}</div>
          <p className="cardSubtitle truncate-overflow">{description}</p>
        </div>
        <p className="cardMore">more</p>
      </div>
    </div>
  )
}

export default Message;