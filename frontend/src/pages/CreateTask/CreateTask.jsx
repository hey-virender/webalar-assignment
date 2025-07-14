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
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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
    } else if (title.trim().length > 100) {
      newErrors.title = "Title must be less than 100 characters";
      hasErrors = true;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      hasErrors = true;
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      hasErrors = true;
    } else if (description.trim().length > 500) {
      newErrors.description = "Description must be less than 500 characters";
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

    try {
      setIsLoading(true);

      if (socket?.connected) {
        // Listen for task creation response
        socket.off("taskCreated"); // Remove any existing listeners
        socket.on("taskCreated", (response) => {
          if (response.success) {
            setSuccess(true);
            // Clear form
            setTitle("");
            setDescription("");

            // Navigate back to dashboard after short delay
            setTimeout(() => {
              navigate("/");
            }, 1500);
          } else {
            setError((prev) => ({
              ...prev,
              general: response.message || "Failed to create task",
            }));
          }
          setIsLoading(false);
        });

        // Listen for errors
        socket.on("taskError", (error) => {
          setError((prev) => ({
            ...prev,
            general: error.message || "Failed to create task",
          }));
          setIsLoading(false);
        });

        // Emit the create task event
        socket.emit("createTask", {
          title: title.trim(),
          description: description.trim(),
        });
      } else {
        // Fallback to HTTP request if socket is not connected
        const response = await axiosInstance.post("/task", {
          title: title.trim(),
          description: description.trim(),
        });

        if (response.status === 200 || response.status === 201) {
          setSuccess(true);
          setTitle("");
          setDescription("");

          setTimeout(() => {
            navigate("/");
          }, 1500);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Create task error:", error);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || "Failed to create task";

        if (status === 400) {
          setError((prev) => ({
            ...prev,
            general: message,
          }));
        } else if (status === 401) {
          setError((prev) => ({
            ...prev,
            general: "You are not authorized to create tasks",
          }));
        } else {
          setError((prev) => ({
            ...prev,
            general: "Failed to create task. Please try again.",
          }));
        }
      } else if (error.request) {
        setError((prev) => ({
          ...prev,
          general:
            "Network error. Please check your internet connection and try again.",
        }));
      } else {
        setError((prev) => ({
          ...prev,
          general: "An unexpected error occurred. Please try again.",
        }));
      }
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  // Clean up socket listeners on unmount
  React.useEffect(() => {
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
                  maxLength={500}
                />
                <div className={styles.charCount}>
                  {description.length}/500 characters
                </div>
                {error.description && (
                  <span className={styles.errorText}>{error.description}</span>
                )}
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
