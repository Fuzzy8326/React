import './App.css';
import React, { Component } from 'react';
import UserForm from './UserForm';
import GitHub from './GitHub';

class App extends Component {
  render() {
    return (
      <div>
        <GitHub />
      </div>
    );
  }
}

export default App;