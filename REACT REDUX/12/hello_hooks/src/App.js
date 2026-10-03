// import React, { useState, useEffect } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { Button } from 'react-bootstrap';

// const App = () => {

//   const postsUrl = "https://jsonplaceholder.typicode.com/posts"
//   const todosUrl = "https://jsonplaceholder.typicode.com/todos"
//   const [requested, setRequested] = useState(postsUrl)
//   const [data, setData] = useState([])

//   useEffect(() => {
//     fetch(requested)
//       .then(response => response.json())
//       .then(data => setData(data))
//   },[requested])

//   return (
//     <div>
//       <Button variant="link" onClick={() => setRequested(postsUrl)}>
//         Posts
//       </Button>
//       <Button variant="link" onClick={() => setRequested(todosUrl)}>
//         Todos
//       </Button>
//       <br />
//       Requested: {requested}
//       <ul>
//         {data.map(el => (
//           <li key={el.id}>{el.title}</li>
//         ))}
//       </ul>
//     </div>
//   )
// }
// export default App;

import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';
import useFetch from './useFetch';
import Users from './Users'

const App = () => {

  const postsUrl = "https://jsonplaceholder.typicode.com/posts"
  const todosUrl = "https://jsonplaceholder.typicode.com/todos"

  const [requested, setRequested] = useState('posts')
  const data = useFetch(requested)

  return (
    <div>
      <Button variant="link" onClick={() => setRequested(postsUrl)}>
        Posts
      </Button>
      <Button variant="link" onClick={() => setRequested(todosUrl)}>
        Todos
      </Button>
      <br />
      Requested: {requested}
      <ul>
        {data.map(el => (
          <li key={el.id}>{el.title}</li>
        ))}
      </ul>
      <Users />
    </div>
  )
}
export default App;