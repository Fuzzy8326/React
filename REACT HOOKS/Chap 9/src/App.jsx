import React, { useReducer } from 'react';
import ToDoList from './ToDoList'

const todosInitialState = {
  todos: []
};

export const TodosContext = React.createContext()

function App() {
  const [state, dispatch] = useReducer(todosReducer, todosInitialState)
  
  return (
    <TodosContext.Provider value={{ state, dispatch }}>
      <ToDoList />
    </TodosContext.Provider>
  )
}

function todosReducer(state, action) {
  switch (action.type) {
    case 'get':
       //Copy and update the todos in the state with action.payload.
      return { ...state, todos: action.payload }
    case 'add':
      // add new todo onto array
      action.payload.text = action.payload.text
      const addedToDos = [...state.todos, action.payload]
      // spread our state and assign todos
      return { ...state, todos: addedToDos }
    case 'delete':
      const filteredTodoState = state.todos.filter(todo => todo.id !==
        action.payload.id)
      return { ...state, todos: filteredTodoState }
    case 'edit':
      const updatedToDo = { ...action.payload }
      const updatedToDoIndex = state.todos.findIndex(t => t.id === action.payload.id)
      const updatedToDos = [
        ...state.todos.slice(0, updatedToDoIndex),
        updatedToDo,
        ...state.todos.slice(updatedToDoIndex + 1)
      ];
      return { ...state, todos: updatedToDos }
    default:
      return todosInitialState
  }
}
export default App;

//To test out the application run npm install -g json-server
//then run Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
//navigate to the folder where todos.json is, in this case the src folder and run json-server todos.json
//Then run npm run dev