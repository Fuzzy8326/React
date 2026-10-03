import React, { Component } from 'react';
import Products from './Products';

// class App extends Component {
//   render() {
//     return (
//       <div>
//         <h1>My First React App!</h1>
//         <Products />
//         <Products />
//         <Products />
//       </div>
//     );
//   }
// }
// export default App;

class App extends Component {

  formatName(user) {
    console.log("formatName called with:", user); // see what user looks like
    return user.firstName + ' ' + user.lastName;
  }

  render() {
    const user = {
      firstName: 'Greg',
      lastName: 'Lim'
    };
    console.log("Formatted name:", this.formatName(user)); // see the result

    return (
      <div>
        <h1>Hello, {this.formatName(user)}</h1>
        <Products />
      </div>
    );
  }
}

export default App;