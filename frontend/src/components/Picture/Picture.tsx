import React from "react";
import './Picture.css';

const colors = [
  "#180161",
  "#4F1787",
  "#EB3678",
  "#FB773C"
]

const Picture = ({image = "", title = "", ...props}) => {

  return (
    <>
      {image.length > 0 ? <div className="imageContainer" style={{backgroundImage: `url(${image})`}} {...props} />
      : <div className="imageContainer imageTitlte" style={{backgroundColor: colors[Math.floor(Math.random() * (colors.length - 1) + 1)]}}>{title?.substr(0, 1)}</div>}
    </>
  )
}

export default Picture;