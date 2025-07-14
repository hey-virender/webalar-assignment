import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Input from "../../components/input/Input";
import Button from "../../components/button/Button";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import Header from "../../components/header/Header";
import styles from "./update-task.module.css";
import { useSocket } from "../../hooks/useSocket";

const UpdateTask = () => {
  const socket = useSocket();
  const { taskId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [users, setUsers] = useState([]);
  const [originalTask, setOriginalTask] = useState(null);
  const [success, setSuccess] = useState(false);

  // Error state
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    general: "",
  });

  // Status options
  const statusOptions = [
    { value: "todo", label: "To Do", color: "#f59e0b" },
    { value: "inProgress", label: "In Progress", color: "#3b82f6" },
    { value: "completed", label: "Completed", color: "#10b981" },
  ];

  // Fetch task data and users on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrors({ title: "", description: "", general: "" });

        // Fetch task details and all users in parallel
        const [taskResponse, usersResponse] = await Promise.all([
          axiosInstance.get(`/task/${taskId}`),
          axiosInstance.get(`/users`),
        ]);

        const task = taskResponse.data.task;
        setOriginalTask(task);
        setTitle(task.title);
        setDescription(task.description);
        setAssignedTo(task.assignedTo?._id || "");
        setStatus(task.status);

        // Set users from the dedicated users endpoint
        setUsers(usersResponse.data.users || []);
      } catch (error) {
        console.error("Error fetching data:", error);

        if (error.response?.status === 404) {
          setErrors((prev) => ({
            ...prev,
            general: "Task not found. It may have been deleted.",
          }));
        } else if (error.response?.status === 403) {
          setErrors((prev) => ({
            ...prev,
            general: "You don't have permission to edit this task.",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            general: "Failed to load task data. Please try again.",
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchData();
    }
  }, [taskId]);

  // Validate form
  const validateForm = () => {
    const newErrors = { title: "", description: "", general: "" };
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
      isValid = false;
    } else if (title.trim().length > 100) {
      newErrors.title = "Title must be less than 100 characters";
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      isValid = false;
    } else if (description.trim().length > 500) {
      newErrors.description = "Description must be less than 500 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleUpdateTask = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if anything actually changed
    const titleChanged = title.trim() !== originalTask.title;
    const descriptionChanged = description.trim() !== originalTask.description;
    const assignedToChanged =
      assignedTo !== (originalTask.assignedTo?._id || "");
    const statusChanged = status !== originalTask.status;

    const hasChanges =
      titleChanged || descriptionChanged || assignedToChanged || statusChanged;

    if (!hasChanges) {
      setErrors((prev) => ({
        ...prev,
        general: "No changes detected",
      }));
      return;
    }

    try {
      setUpdating(true);
      setErrors({ title: "", description: "", general: "" });
      setSuccess(false);

      // Prepare updates object
      const updates = {};
      if (titleChanged) updates.title = title.trim();
      if (descriptionChanged) updates.description = description.trim();
      if (assignedToChanged) updates.assignedTo = assignedTo || null;
      if (statusChanged) updates.status = status;

      if (socket?.connected) {
        // Listen for update response
        socket.off("taskUpdated");
        socket.off("taskStatusUpdated");
        socket.off("taskError");

        socket.on("taskUpdated", (response) => {
          if (response.success) {
            setSuccess(true);
            setOriginalTask({ ...originalTask, ...updates });

            setTimeout(() => {
              navigate("/");
            }, 1500);
          } else {
            setErrors((prev) => ({
              ...prev,
              general: response.message || "Failed to update task",
            }));
          }
          setUpdating(false);
        });

        socket.on("taskStatusUpdated", (response) => {
          if (response.success) {
            setSuccess(true);
            setOriginalTask({ ...originalTask, status });

            setTimeout(() => {
              navigate("/");
            }, 1500);
          } else {
            setErrors((prev) => ({
              ...prev,
              general: response.message || "Failed to update task status",
            }));
          }
          setUpdating(false);
        });

        socket.on("taskError", (error) => {
          setErrors((prev) => ({
            ...prev,
            general: error.message || "Failed to update task",
          }));
          setUpdating(false);
        });

        // Emit update based on what changed
        if (
          statusChanged &&
          (titleChanged || descriptionChanged || assignedToChanged)
        ) {
          // Update fields first, then status
          socket.emit("updateTask", { taskId, updates: { ...updates } });
          delete updates.status; // Status will be updated separately
        } else if (statusChanged) {
          socket.emit("updateTaskStatus", { taskId, newStatus: status });
        } else {
          socket.emit("updateTask", { taskId, updates });
        }
      } else {
        // Fallback to HTTP request
        const response = await axiosInstance.put(`/task/${taskId}`, updates);

        if (response.status === 200) {
          setSuccess(true);
          setOriginalTask({ ...originalTask, ...updates });

          setTimeout(() => {
            navigate("/");
          }, 1500);
        }
        setUpdating(false);
      }
    } catch (error) {
      console.error("Error updating task:", error);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || "Failed to update task";

        if (status === 404) {
          setErrors((prev) => ({
            ...prev,
            general: "Task not found. It may have been deleted.",
          }));
        } else if (status === 403) {
          setErrors((prev) => ({
            ...prev,
            general: "You don't have permission to update this task.",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            general: message,
          }));
        }
      } else if (error.request) {
        setErrors((prev) => ({
          ...prev,
          general:
            "Network error. Please check your internet connection and try again.",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "An unexpected error occurred. Please try again.",
        }));
      }
      setUpdating(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/");
  };

  // Clean up socket listeners on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.off("taskUpdated");
        socket.off("taskStatusUpdated");
        socket.off("taskError");
      }
    };
  }, [socket]);

  if (loading) {
    return (
      <ProtectedRoutes>
        <div className={styles.updateTaskContainer}>
          <Header />
          <div className={styles.updateTaskContent}>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading task details...</p>
            </div>
          </div>
        </div>
      </ProtectedRoutes>
    );
  }

  if (errors.general && !originalTask) {
    return (
      <ProtectedRoutes>
        <div className={styles.updateTaskContainer}>
          <Header />
          <div className={styles.updateTaskContent}>
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠</div>
              <h2>Unable to Load Task</h2>
              <p>{errors.general}</p>
              <Button onClick={handleCancel} variant="secondary">
                Go Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoutes>
    );
  }

  return (
    <ProtectedRoutes>
      <div className={styles.updateTaskContainer}>
        <Header />
        <div className={styles.updateTaskContent}>
          <div className={styles.updateTaskCard}>
            <div className={styles.updateTaskHeader}>
              <h1 className={styles.updateTaskTitle}>Update Task</h1>
              <p className={styles.updateTaskSubtitle}>
                Modify task details and assignment
              </p>
            </div>

            {errors.general && (
              <div className={styles.errorMessage}>{errors.general}</div>
            )}

            {success && (
              <div className={styles.successMessage}>
                Task updated successfully! Redirecting to dashboard...
              </div>
            )}

            <form onSubmit={handleUpdateTask} className={styles.updateTaskForm}>
              <Input
                label="Task Title"
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                disabled={updating || success}
                required
                placeholder="Enter a descriptive title for your task"
              />

              <div className={styles.textareaWrapper}>
                <label htmlFor="description" className={styles.textareaLabel}>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${styles.textarea} ${
                    errors.description ? styles.textareaError : ""
                  }`}
                  disabled={updating || success}
                  required
                  rows={6}
                  maxLength={500}
                  placeholder="Provide a detailed description of the task..."
                />
                <div className={styles.charCount}>
                  {description.length}/500 characters
                </div>
                {errors.description && (
                  <span className={styles.errorText}>{errors.description}</span>
                )}
              </div>

              <div className={styles.selectGroup}>
                <div className={styles.selectWrapper}>
                  <label htmlFor="assignedTo" className={styles.selectLabel}>
                    Assigned To
                  </label>
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className={styles.select}
                    disabled={updating || success}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.selectWrapper}>
                  <label htmlFor="status" className={styles.selectLabel}>
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={styles.select}
                    disabled={updating || success}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div
                    className={styles.statusIndicator}
                    style={{
                      backgroundColor: statusOptions.find(
                        (opt) => opt.value === status,
                      )?.color,
                    }}
                  ></div>
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <Button
                  type="submit"
                  disabled={updating || success}
                  loading={updating}
                  size="large"
                >
                  {updating ? "Updating..." : "Update Task"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={updating}
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

export default UpdateTask;
