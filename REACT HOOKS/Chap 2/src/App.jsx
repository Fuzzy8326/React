import React from 'react'
import Products from './Products'

function formatName(user) {
  return user.firstName + ' ' + user.lastName
}

function App() {
  const user = {
    firstName: 'Greg',
    lastName: 'Tan',
    imageUrl:'https://picsum.photos/200/300'
  }

  return (
    <div>
      <h1>Hello, {formatName(user)}</h1>
      <Products />
      <br/>
      <img src={user.imageUrl}></img>
    </div>
  )
}

export default App
