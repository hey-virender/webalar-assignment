import { useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Auth/login/Login";
import Register from "./pages/Auth/register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateTask from "./pages/CreateTask/CreateTask";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/create-task" element={<CreateTask />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
