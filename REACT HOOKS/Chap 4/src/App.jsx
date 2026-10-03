import React from 'react'
import Products from './Products'
import Rating from './Rating'
import { Button } from 'react-bootstrap'

function formatName(user) {
  return user.firstName + ' ' + user.lastName
}

function App() {
  const isValid = true

  return (
    <div>
      <Products />
    </div>
  )
}

export default App
