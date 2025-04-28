import React, { useState, useEffect, useCallback } from "react";
import './InfiniteScroll.css';

const InfiniteScroll = ({ renderComponent, query = "", categories }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState();

  const fetchData = (_cursor) => fetch("http://localhost:8000/opportunities?cursor=" + _cursor + "&query=" + query + "&categories=" + categories.join(",")).then((rawRes) => {
    console.log('cursor', cursor)
    return rawRes.json();
  });

  const _fetchData = useCallback(async () => {
    console.log('new data coming')

    if (isLoading) return;
    setIsLoading(true);

    const data = await fetchData(cursor)
    setItems((prevItems) => [...prevItems, ...data.data])
    setCursor(data.cursor);

    setIsLoading(false);

  }, [cursor, isLoading]);

  useEffect(() => {
    const getData = async () => {
      console.log('first data coming')
      setIsLoading(true);

      const data = await fetchData(undefined)
      setItems([...data.data])
      console.log('first cursor', data.cursor)
      setCursor(data.cursor);

      setIsLoading(false);
    };

    getData();
  }, [query]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        _fetchData();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [_fetchData]);

  return (
    <div className='InfiniteScrollContainer'>
      {items.map((item) => renderComponent(item))}
      {isLoading && <h2>loading...</h2>}
    </div>
  );

}

export default InfiniteScroll;