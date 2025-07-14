import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskCard from "../task-card/TaskCard";
import styles from "./task-board.module.css";
import { useSocket } from "../../hooks/useSocket";
import axiosInstance from "../../api/axiosInstance";

const TaskBoard = () => {
  const navigate = useNavigate();
  const socket = useSocket(
    () => {
      console.log("connected to socket");
    },
    () => {
      console.log("disconnected from socket");
    },
  );
  const [tasks, setTasks] = useState([]);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await axiosInstance.get("/task");
      console.log(response.data.tasks);
      setTasks(response.data.tasks);
    };
    fetchTasks();
  }, []);
  useEffect(() => {
    const handleTaskStatusUpdated = (task) => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === task._id ? task : t)),
      );
    };

    socket.on("taskStatusUpdated", handleTaskStatusUpdated);

    // Cleanup function to remove the listener
    return () => {
      socket.off("taskStatusUpdated", handleTaskStatusUpdated);
    };
  }, [socket]);
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    console.log("Drop - Task ID:", taskId, "New Status:", newStatus);

    socket.emit("updateTaskStatus", { taskId, newStatus });
    setDraggedTaskId(null);
  };

  // Task action handlers
  const handleEditTask = (taskId) => {
    console.log("Edit task:", taskId);
    navigate(`/update-task/${taskId}`);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axiosInstance.delete(`/task/${taskId}`);
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task._id !== taskId),
        );
        console.log("Task deleted successfully");
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task. Please try again.");
      }
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      const response = await axiosInstance.patch(
        `/task/${taskId}/smart-assign`,
      );
      console.log("Task smart-assigned:", response.data);
      // Update the task in local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? { ...task, assignedTo: response.data.assignedTo }
            : task,
        ),
      );
    } catch (error) {
      console.error("Error smart-assigning task:", error);
      alert("Failed to smart assign task. Please try again.");
    }
  };

  const statuses = [
    { key: "todo", label: "To Do" },
    { key: "inProgress", label: "In Progress" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <section className={styles.taskBoardContainer}>
      <div className={styles.taskBoard}>
        {statuses.map((status) => (
          <div
            key={status.key}
            className={styles.taskBoardSection}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.key)}
          >
            <h2 className={styles.taskBoardSectionTitle}>{status.label}</h2>
            <div className={styles.taskBoardSectionTasks}>
              {tasks
                .filter((task) => task.status === status.key)
                .map((task) => (
                  <TaskCard
                    key={task._id}
                    {...task}
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onDragEnd={handleDragEnd}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onSmartAssign={handleSmartAssign}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TaskBoard;
