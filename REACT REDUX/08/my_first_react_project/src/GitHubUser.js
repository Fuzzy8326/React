import React, { Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

// function GitHubUser() {

//     const { id, login } = useParams();
//     return (
//         <div>
//             <h1>User Login: {login}</h1>
//             <h2>User Id: {id}</h2>
//         </div>
//     );
// }

// export default GitHubUser;


function GitHubUser() {

    const { id, login } = useParams();
    const navigate = useNavigate();

    console.log("Params:", { id, login });

    const handleClick = () => {
        console.log("Navigating to /github");
        navigate("/github")
    }

    return (
        <div>
            <h1>User Login: {login}</h1>
            <h2>User Id: {id}</h2>
            <Button variant="primary" onClick={handleClick}>
                Go to GitHub Users
            </Button>
        </div>
    );
}

export default GitHubUser;

