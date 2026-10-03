import React, { use, useState } from 'react'
import { Table, Form, Button } from 'react-bootstrap'
import { TodosContext } from './App'

function ToDoList() {
  const { state, dispatch } = use(TodosContext)
  const [todoText, setTodoText] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [editTodo, setEditTodo] = useState(null)
  const buttonTitle = editMode ? "Edit" : "Add"


  const handleSubmit = async (formData) => { 
    if(editMode){            
      dispatch({type: 'edit', payload:{...editTodo,text:todoText}})
      setEditMode(false)
      setEditTodo(null)
    }
    else{
        dispatch({type: 'add', payload: todoText})
    }  

    setTodoText("") // to clear field after adding
  }

  return (
    <div style={{ padding: 5 }}>
      <Form action={handleSubmit}>
        <Form.Group controlId="todoForm">
          <Form.Control
            type="text"
            placeholder="Enter To Do"
            onChange={event => setTodoText(event.target.value)} />
        </Form.Group>
        <Button variant="primary" type="submit">
          {buttonTitle}
        </Button>
      </Form>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>To Do</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {state.todos.map(todo => (
            <tr key={todo.id}>
              <td>{todo.text}</td>
              <td onClick={() => {
                setTodoText(todo.text)
                setEditMode(true)
                setEditTodo(todo)
              }}>
                Edit
              </td>

              <td onClick={() =>
                dispatch({ type: 'delete', payload: todo })}>Delete</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
export default ToDoList

// import React, { useState, useContext } from 'react';
// import { Table, Form, Button, Alert } from 'react-bootstrap';
// import { TodosContext } from './App';

// function ToDoList() {
//   const { state, dispatch } = useContext(TodosContext);
//   const [todoText, setTodoText] = useState("");
//   const [editMode, setEditMode] = useState(false);
//   const [editTodo, setEditTodo] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const buttonTitle = editMode ? "Edit" : "Add";

//   const handleSubmit = (event) => {
//     event.preventDefault(); // Prevent form submission

//     if (!todoText.trim()) {
//       setErrorMessage("Enter a todo");
//       return;
//     }

//     if (editMode) {
//       dispatch({ type: 'edit', payload: { ...editTodo, text: todoText } });
//       setEditMode(false);
//       setEditTodo(null);
//     } else {
//       const duplicate = state.todos.some(todo => todo.text === todoText);
//       if (duplicate) {
//         setErrorMessage("Duplicate todo");
//         return;
//       }
//       dispatch({ type: 'add', payload: todoText });
//     }

//     setTodoText(""); // Clear field after adding
//     setErrorMessage(""); // Clear any existing error messages
//   };

//   return (
//     <div style={{ padding: 5 }}>
//       <Form onSubmit={handleSubmit}>
//         <Form.Group controlId="todoForm">
//           <Form.Control
//             type="text"
//             placeholder="Enter To Do"
//             value={todoText}
//             onChange={event => setTodoText(event.target.value)}
//           />
//         </Form.Group>
//         <Button variant="primary" type="submit">
//           {buttonTitle}
//         </Button>
//         {errorMessage && <Alert variant="danger" style={{ marginTop: '10px' }}>{errorMessage}</Alert>}
//       </Form>
//       <Table striped bordered hover>
//         <thead>
//           <tr>
//             <th>To Do</th>
//             <th>Edit</th>
//             <th>Delete</th>
//           </tr>
//         </thead>
//         <tbody>
//           {state.todos.map(todo => (
//             <tr key={todo.id}>
//               <td>{todo.text}</td>
//               <td onClick={() => {
//                 setTodoText(todo.text);
//                 setEditMode(true);
//                 setEditTodo(todo);
//                 setErrorMessage(""); // Clear any existing error messages
//               }}>
//                 Edit
//               </td>
//               <td onClick={() => dispatch({ type: 'delete', payload: todo })}>
//                 Delete
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </Table>
//     </div>
//   );
// }

// export default ToDoList;