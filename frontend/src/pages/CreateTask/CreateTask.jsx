import React, { useState } from "react";
import Input from "../../components/input/Input";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import Button from "../../components/button/Button";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header/Header";
import styles from "./create-task.module.css";
import { useSocket } from "../../hooks/useSocket";

const CreateTask = () => {
  const socket = useSocket();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState({
    title: "",
    description: "",
  });
  const navigate = useNavigate();

  const handleCreateTask = async () => {
    try {
      if (!title) {
        setError((prev) => ({ ...prev, title: "Title is required" }));
      }
      if (!description) {
        setError((prev) => ({
          ...prev,
          description: "Description is required",
        }));
      }
      if (title && description) {
        
        socket.emit("createTask", {
          title,
          description,
    
        });
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ProtectedRoutes>
      <div className={styles.createTaskContainer}>
        <Header />
        <div className={styles.createTaskTitle}>
          <h1>Create Task</h1>
        </div>
        <div className={styles.createTaskForm}>
          <Input
            label="Title"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Description"
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleCreateTask}>Create Task</Button>
        </div>
      </div>
    </ProtectedRoutes>
  );
};

export default CreateTask;
