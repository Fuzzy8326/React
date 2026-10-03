import React, { use, Suspense, useEffect, useState } from 'react'
import axios from 'axios' // npm install axios
import Spinner from 'react-bootstrap/Spinner'

function fetchData(searchTerm) {
    return new Promise((resolve, reject) => {
        axios.get(`https://swapi.dev/api/people/?search=${searchTerm}`)
            .then((res) => {
                console.log(res.data.results)
                resolve(res.data.results)
            })
    })
}

const Characters = ({ fetchDataPromise }) => {
    const data = use(fetchDataPromise)

    return (
        <div>
        {data.map((item) => {
            return <div key={item.name}>{item.name}</div>
        })}
        </div>
    )
}

function StarWars() {
    const [searchTerm, setSearchTerm] = useState("")

    return (    
        <Suspense fallback={<Spinner animation="border" />}>
            <Characters fetchDataPromise={fetchData(searchTerm)} />
        </Suspense>
    )
}

export default StarWars
