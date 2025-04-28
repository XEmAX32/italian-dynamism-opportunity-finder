import React, { useEffect, useState } from "react";
import "./Opportunities.css";
import Card from '../../components/Card/Card.tsx';
import { useNavigate } from 'react-router-dom';
import InfiniteScroll from "../../components/InfiniteScroll/InfiniteScroll.tsx";
import MultiSelect from "../../components/MultiSelect/MultiSelect.tsx";

const Opportunities = () => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([])

  const categories = [
    { id: 1, title: 'Youth Participation' },
    { id: 2, title: 'Learning' },
    { id: 3, title: 'Leadership' },
    { id: 4, title: 'Research' },
    { id: 5, title: 'Fellowship' },
    { id: 6, title: 'Business' },
    { id: 7, title: 'Mentorship' },
    { id: 8, title: 'Startup' },
    { id: 9, title: 'Talent Program' },
    { id: 10, title: 'International Mobility' },
    { id: 11, title: 'Tech' },
    { id: 12, title: 'Climate' },
    { id: 13, title: 'Sustainability' },
    { id: 14, title: 'Prize' },
    { id: 15, title: 'Arts' },
]
  const toggleOption = ({ id }) => {
    setSelected(prevSelected => {
        // if it's in, remove
        const newArray = [...prevSelected]
        if (newArray.includes(id)) {
            return newArray.filter(item => item != id)
            // else, add
        } else {
            newArray.push(id)
            return newArray;
        }
    })
}
  return (
    <div className="container">
      <div className="horizontalContainer">
        <input 
          type="text" 
          className="searchInput magicBorder" 
          placeholder="What's your next step?" 
          onChange={(event) => setQuery(event.target.value)}
          value={query} 
        />
        <MultiSelect options={categories} selected={selected} toggleOption={toggleOption} />
      </div>
      <InfiniteScroll 
        query={query}
        categories={categories}
        renderComponent={(item) => <Card title={item.title} description={item.description} link={item.title} />}
      />
    </div>
  );
}

export default Opportunities;