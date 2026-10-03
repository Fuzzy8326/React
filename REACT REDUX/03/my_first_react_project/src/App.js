import React, { Component } from 'react';
import Products from './Products';
import Rating from './Rating';
import { Button } from 'react-bootstrap';

class App extends Component {
  render() {
    const isValid = true;

    return (
      <div>
        
        <Products />
        <Button>Default</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" disabled>Default</Button>
        <Button variant="primary" disabled={!isValid}>Default</Button>

        <div>
          <Rating rating="1" />
          <Rating rating="2" />
          <Rating rating="3" />
          <Rating rating="4" />
          <Rating rating="5" />
        </div>

      </div>

    );
  }
}

export default App;