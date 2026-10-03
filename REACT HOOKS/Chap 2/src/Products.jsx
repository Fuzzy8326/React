import React from 'react'

function Products() {
  const products = ["Learning React","Pro React","Beginning React"]
  console.log("products:", products); // check the array
  const listProducts = products.map((product) => 
      <li key={product.toString()}>{product}</li>
  )
  console.log("listProducts:", listProducts); // array of React elements
  return (
    <div>
      <ul>{listProducts}</ul>
    </div>
  )
}

export default Products