import React, { useEffect, useState } from "react";
import "./Details.css";
import { useParams, useNavigate } from 'react-router-dom';

const Pill = ({content}) => <span className="pill">{content}</span>;

const Details = () => {
  const title = "Silicon Valley Fellowship";
  const image = "https://theorcanetwork.com/favicon.ico"
  const categories = ["fellowship", "politics", "economics"];
  const params = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({});

  useEffect(() => {
    // const res = conn(params.opportunityId).then((res) => console.log(res))

    fetch("http://localhost:8000/opportunity/" + params.opportunityId?.replace('-', '*'))
    .then((rawRes) => {
      rawRes.json().then((res) => {console.log('res', res);setData(res)})
    });

  }, []);

  return (
    <>
      <div className="header" style={{ backgroundImage: `url(${image})` }}>
        <div className="backBtn" onClick={() => navigate(-1)}>
          <svg height="20px" id="Layer_1" version="1.1" viewBox="0 0 512 512" width="20px" xmlns="http://www.w3.org/2000/svg"><polygon points="352,128.4 319.7,96 160,256 160,256 160,256 319.7,416 352,383.6 224.7,256 "/></svg>
        </div>
      </div>
      <h1 className="title">{data.title !== undefined && data.title}</h1>
      <div className="categoriesContainer">
        { data.categories !== undefined && data.categories.map((category) => <Pill content={category} />) }
      </div>
      <div className="content">
        <h2>Description</h2>
        <p>{ data.description !== undefined && data.description }</p>
        <br/>
        <h2>Ideal candidate</h2>
        <p>{ data.idealCandidate !== undefined && data.idealCandidate }</p>
        <br/>
        <h2>How to apply</h2>
        <p>{ data.howTo !== undefined && data.howTo }</p>
        <br/>

        <button className="magicBorder button" style={{color: "white"}} onClick={() => window.open(data.link, '_blank')}>Apply</button>
      </div>
    </>
  );
}

export default Details;