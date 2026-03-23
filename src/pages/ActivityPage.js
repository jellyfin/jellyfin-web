import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [filter, setFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get('/api/activities', {
          params: {
            page: pageNumber,
            pageSize: pageSize,
            filter: filter
          }
        });
        setActivities(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchActivities();
  }, [pageNumber, filter, pageSize]);

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPageNumber(1);
  };

  const handlePageChange = (pageNumber) => {
    setPageNumber(pageNumber);
  };

  return (
    <div>
      <input type='text' value={filter} onChange={handleFilterChange} placeholder='Filter by user' />
      <ul>
        {activities.map((activity) => (
          <li key={activity.id}>{activity.name}</li>
        ))}
      </ul>
      <button onClick={() => handlePageChange(pageNumber - 1)}>Previous</button>
      <button onClick={() => handlePageChange(pageNumber + 1)}>Next</button>
    </div>
  );
};

export default ActivityPage;