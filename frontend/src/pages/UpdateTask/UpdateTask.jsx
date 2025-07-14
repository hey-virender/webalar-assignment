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

  // Error state
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    general: "",
  });

  // Status options
  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "inProgress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  // Fetch task data and users on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

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
        setUsers(usersResponse.data.users);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrors((prev) => ({
          ...prev,
          general: "Failed to load task data. Please try again.",
        }));
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
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleUpdateTask = async () => {
    if (!validateForm()) {
      return;
    }

    // Check if anything actually changed
    const titleChanged = title !== originalTask.title;
    const descriptionChanged = description !== originalTask.description;
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

      // Handle title/description updates only if they changed
      if (titleChanged || descriptionChanged) {
        const updateData = {};
        if (titleChanged) updateData.title = title;
        if (descriptionChanged) updateData.description = description;

        socket.emit("updateTask", {
          taskId,
          updates: updateData,
        });
        socket.on("taskUpdated", (task) => {
          console.log(task);
         
        });
      }

      // Handle assignedTo update separately
      if (assignedToChanged) {
        if (assignedTo) {
          socket.emit("updateTask", {
            taskId,
            updates: { assignedTo },
          });
          socket.on("taskUpdated", (task) => {
            console.log(task);
            
          });
        } else {
          // Handle unassigning - you might want to create an endpoint for this
          // For now, we'll assign to null
          socket.emit("updateTask", {
            taskId,
            updates: { assignedTo: null },
          });
          socket.on("taskUpdated", (task) => {
            console.log(task);
        
          });
        }
      }

      // Handle status update separately
      if (statusChanged) {
        socket.emit("updateTaskStatus", {
          taskId,
          newStatus: status,
        });
        socket.on("taskStatusUpdated", (task) => {
          console.log(task);
         
        });
      }

      // Navigate back to dashboard after successful update
      navigate("/");
    } catch (error) {
      console.error("Error updating task:", error);
      setErrors((prev) => ({
        ...prev,
        general:
          error.response?.data?.message ||
          "Failed to update task. Please try again.",
      }));
    } finally {
      setUpdating(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <ProtectedRoutes>
        <div className={styles.updateTaskContainer}>
          <Header />
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading task details...</p>
          </div>
        </div>
      </ProtectedRoutes>
    );
  }

  return (
    <ProtectedRoutes>
      <div className={styles.updateTaskContainer}>
        <Header />
        <div className={styles.updateTaskTitle}>
          <h1>Update Task</h1>
        </div>
        <div className={styles.updateTaskForm}>
          {errors.general && (
            <div className={styles.errorMessage}>{errors.general}</div>
          )}

          <Input
            label="Title"
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />

          <Input
            label="Description"
            type="text"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
          />

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
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.buttonGroup}>
            <Button onClick={handleUpdateTask} disabled={updating}>
              {updating ? "Updating..." : "Update Task"}
            </Button>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={updating}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoutes>
  );
};

export default UpdateTask;
