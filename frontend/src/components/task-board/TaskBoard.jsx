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
  const [dragOverSection, setDragOverSection] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await axiosInstance.get("/task");
      setTasks(response.data.tasks);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const handleTaskStatusUpdated = (data) => {
      const { task, success, error } = data;
      if (success && task) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === task._id ? task : t)),
        );
      } else {
        console.log("Task status update failed:", error);
      }
    };

    const handleTaskDeleted = (data) => {
      const { task, success, error } = data;
      if (success && task) {
        setTasks((prevTasks) => prevTasks.filter((t) => t._id !== task._id));
       
      } else {
        console.log("Task deletion failed:", error);
      }
    };

    const handleTaskAssigned = (data) => {
      const { task, success, error } = data;
      if (success && task) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === task._id ? task : t)),
        );
      } else {
        console.log("Task assignment failed:", error);
      }
    };

    // Handle task updates
    const handleTaskUpdated = (data) => {
      const { task, success, error } = data;
     
      if (success && task) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === task._id ? task : t)),
        );
      } else {
        console.log("Task update failed:", error);
      }
    };

    // Handle task creation
    const handleTaskCreated = (data) => {
      const { task, success, error } = data;
     
      if (success && task) {
        setTasks((prevTasks) => [...prevTasks, task]);
      } else {
        console.log("Task creation failed:", error);
      }
    };

    // Handle conflict resolution
    const handleConflictResolved = (data) => {
      const { task, success, resolvedBy, resolutionType } = data;
     
      if (success && task) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === task._id ? task : t)),
        );

      
        console.log(
          `Conflict resolved by user ${resolvedBy} using ${resolutionType}`,
        );
      }
    };

    socket.on("taskStatusUpdated", handleTaskStatusUpdated);
    socket.on("taskDeleted", handleTaskDeleted);
    socket.on("taskAssigned", handleTaskAssigned);
    socket.on("taskUpdated", handleTaskUpdated);
    socket.on("taskCreated", handleTaskCreated);
    socket.on("conflictResolved", handleConflictResolved);

    // Cleanup function to remove the listeners
    return () => {
      socket.off("taskStatusUpdated", handleTaskStatusUpdated);
      socket.off("taskDeleted", handleTaskDeleted);
      socket.off("taskAssigned", handleTaskAssigned);
      socket.off("taskUpdated", handleTaskUpdated);
      socket.off("taskCreated", handleTaskCreated);
      socket.off("conflictResolved", handleConflictResolved);
    };
  }, [socket]);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    setIsDragActive(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);

    // Add a slight delay to ensure the drag visual feedback shows
    setTimeout(() => {
      const draggedElement = document.querySelector(
        `[data-task-id="${taskId}"]`,
      );
      if (draggedElement) {
        draggedElement.style.opacity = "0.2";
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverSection(null);
    setIsDragActive(false);

    // Clean up any visual feedback
    const allCards = document.querySelectorAll("[data-task-id]");
    allCards.forEach((card) => {
      card.style.opacity = "";
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, status) => {
    e.preventDefault();
    setDragOverSection(status);
  };

  const handleDragLeave = (e) => {
    // Only remove drag over state if we're leaving the section entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSection(null);
    }
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");


//Only update if status actually changes
    const draggedTask = tasks.find((task) => task._id === taskId);
    if (draggedTask && draggedTask.status !== newStatus) {
      socket.emit("updateTaskStatus", { taskId, newStatus });

      // Add visual feedback for successful drop
      const section = e.currentTarget;
      section.style.transform = "scale(1.02)";
      setTimeout(() => {
        section.style.transform = "";
      }, 200);
    }

    setDraggedTaskId(null);
    setDragOverSection(null);
    setIsDragActive(false);
  };

  // Task action handlers
  const handleEditTask = (taskId) => {
   
    navigate(`/update-task/${taskId}`);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        socket.emit("deleteTask", { taskId });
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task. Please try again.");
      }
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      socket.emit("smartAssign", { taskId });
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

  // Get section className with drag states
  const getSectionClassName = (status) => {
    let className = styles.taskBoardSection;

    if (dragOverSection === status.key) {
      className += ` ${styles.dragOver}`;
    }

    if (isDragActive) {
      className += ` ${styles.dragActive}`;
    }

    return className;
  };

  // Get tasks className with drag states
  const getTasksClassName = (status) => {
    let className = styles.taskBoardSectionTasks;

    if (dragOverSection === status.key) {
      className += ` ${styles.dropZone}`;
    }

    return className;
  };

  return (
    <section className={styles.taskBoardContainer}>
      <div className={styles.taskBoard}>
        {statuses.map((status) => (
          <div
            key={status.key}
            className={getSectionClassName(status)}
            data-status={status.key}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, status.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status.key)}
          >
            <h2 className={styles.taskBoardSectionTitle}>{status.label}</h2>
            <div className={getTasksClassName(status)}>
              {tasks
                .filter((task) => task.status === status.key)
                .map((task) => (
                  <TaskCard
                    key={task._id}
                    {...task}
                    isDragging={draggedTaskId === task._id}
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
