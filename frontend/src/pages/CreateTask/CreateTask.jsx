import React, { useEffect, useState } from "react";
import Input from "../../components/input/Input";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import Button from "../../components/button/Button";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header/Header";
import styles from "./create-task.module.css";
import { useSocket } from "../../hooks/useSocket";

const CreateTask = () => {
  const socket = useSocket();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  // UI state
  const [error, setError] = useState({
    title: "",
    description: "",
    general: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = { title: "", description: "", general: "" };
    let hasErrors = false;

    if (!title.trim()) {
      newErrors.title = "Title is required";
      hasErrors = true;
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
      hasErrors = true;
    } else if (title.trim().length > 20) {
      newErrors.title = "Title must be less than 20 characters";
      hasErrors = true;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      hasErrors = true;
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      hasErrors = true;
    } else if (description.trim().length > 100) {
      newErrors.description = "Description must be less than 100 characters";
      hasErrors = true;
    }

    setError(newErrors);
    return !hasErrors;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError({ title: "", description: "", general: "" });
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    if (socket?.connected) {
      // Emit the create task event
      socket.emit("createTask", {
        title: title.trim(),
        description: description.trim(),
        priority: priority.trim(),
      });

      const handleTaskCreated = (data) => {
        const { task, success, error } = data;
        if (success && task) {
          setSuccess(true);
          setTitle("");
          setDescription("");
          navigate("/");
        } else {
          setError({ general: error });
        }
        setIsLoading(false);
        // Clean up the listener
        socket.off("taskCreated", handleTaskCreated);
      };

      socket.on("taskCreated", handleTaskCreated);
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    navigate("/");
  };

  // Clean up socket listeners on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.off("taskCreated");
        socket.off("taskError");
      }
    };
  }, [socket]);

  return (
    <ProtectedRoutes>
      <div className={styles.createTaskContainer}>
        <Header />
        <div className={styles.createTaskContent}>
          <div className={styles.createTaskCard}>
            <div className={styles.createTaskHeader}>
              <h1 className={styles.createTaskTitle}>Create New Task</h1>
              <p className={styles.createTaskSubtitle}>
                Add a new task to your board
              </p>
            </div>

            {error.general && (
              <div className={styles.errorMessage}>{error.general}</div>
            )}

            {success && (
              <div className={styles.successMessage}>
                Task created successfully! Redirecting to dashboard...
              </div>
            )}

            <form onSubmit={handleCreateTask} className={styles.createTaskForm}>
              <Input
                label="Task Title"
                type="text"
                name="title"
                placeholder="Enter a descriptive title for your task"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={error.title}
                disabled={isLoading || success}
                required
              />

              <div className={styles.textareaWrapper}>
                <label htmlFor="description" className={styles.textareaLabel}>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Provide a detailed description of the task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${styles.textarea} ${
                    error.description ? styles.textareaError : ""
                  }`}
                  disabled={isLoading || success}
                  required
                  rows={6}
                  maxLength={100}
                />
                <div className={styles.charCount}>
                  {description.length}/100 characters
                </div>
                {error.description && (
                  <span className={styles.errorText}>{error.description}</span>
                )}
              </div>

              <div className={styles.selectWrapper}>
                <label htmlFor="priority" className={styles.selectLabel}>
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={styles.select}
                  disabled={isLoading || success}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className={styles.buttonGroup}>
                <Button
                  type="submit"
                  disabled={isLoading || success}
                  loading={isLoading}
                  size="large"
                >
                  {isLoading ? "Creating Task..." : "Create Task"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                  size="large"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoutes>
  );
};

export default CreateTask;
