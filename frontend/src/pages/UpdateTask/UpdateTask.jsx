import React, { useEffect, useState, useRef } from "react";
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
  const [priority, setPriority] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [users, setUsers] = useState([]);
  const [originalTask, setOriginalTask] = useState(null);
  const [success, setSuccess] = useState(false);

  // Version control and conflict resolution state
  const [taskVersion, setTaskVersion] = useState(null);
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [conflictMode, setConflictMode] = useState({
    active: false,
    currentTask: null,
    proposedChanges: null,
    conflicts: null,
  });
  const [collaborators, setCollaborators] = useState([]);

  // Ref to track editing session state and prevent duplicates
  const editingSessionRef = useRef(false);
  const sessionStartedRef = useRef(false);

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

  const priorityOptions = [
    { value: "low", label: "Low", color: "#10b981" },
    { value: "medium", label: "Medium", color: "#3b82f6" },
    { value: "high", label: "High", color: "#f59e0b" },
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
          axiosInstance.get(`/user`),
        ]);

        const task = taskResponse.data.task;
        setOriginalTask(task);
        setTitle(task.title);
        setDescription(task.description);
        setAssignedTo(task.assignedTo?._id || "");
        setStatus(task.status);
        setPriority(task.priority);

        // Set task version for conflict detection
        setTaskVersion(task.version || 1);
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

  // Editing session management
  useEffect(() => {
    if (
      taskId &&
      socket?.connected &&
      !loading &&
      originalTask &&
      !sessionStartedRef.current
    ) {
      // Mark session as started to prevent duplicates
      sessionStartedRef.current = true;
      editingSessionRef.current = true;

      // Start editing session
      socket.emit("startEditingTask", { taskId });
      setIsEditingSession(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, socket?.connected, loading, originalTask?._id]);

  // Cleanup effect - separate from the start effect
  useEffect(() => {
    return () => {
      if (sessionStartedRef.current && socket?.connected && taskId) {
        socket.emit("endEditingTask", { taskId });
        sessionStartedRef.current = false;
        editingSessionRef.current = false;
      }
    };
  }, [taskId, socket]);

  // Socket event handlers for collaboration and conflict resolution
  useEffect(() => {
    if (!socket) return;

    // Handle editing session confirmations
    const handleEditingSessionStarted = (data) => {
      editingSessionRef.current = true;
      setIsEditingSession(true);
    };

    const handleEditingSessionEnded = (data) => {
      editingSessionRef.current = false;
      setIsEditingSession(false);
    };

    // Handle real-time collaboration updates
    const handleUserStartedEditing = (data) => {
      if (data.taskId === taskId) {
        setCollaborators((prev) => {
          const existing = prev.find((c) => c.userId === data.userId);
          if (!existing) {
            const newCollaborators = [
              ...prev,
              { userId: data.userId, userName: data.userName },
            ];

            return newCollaborators;
          }

          return prev;
        });
      }
    };

    const handleUserStoppedEditing = (data) => {
      if (data.taskId === taskId) {
        setCollaborators((prev) =>
          prev.filter((c) => c.userId !== data.userId),
        );
      }
    };

    // Handle conflict detection
    const handleConflictDetected = (data) => {
      if (data.taskId === taskId) {
        setConflictMode({
          active: true,
          currentTask: data.currentTask,
          proposedChanges: data.proposedChanges,
          conflicts: data.conflicts,
        });
        setUpdating(false); // Stop loading state
      }
    };

    // Handle conflict resolution
    const handleConflictResolved = (data) => {
      if (data.task && data.task._id === taskId) {
        // Update our local state with the resolved task
        setOriginalTask(data.task);
        setTaskVersion(data.task.version);
        setConflictMode({
          active: false,
          currentTask: null,
          proposedChanges: null,
          conflicts: null,
        });

        // Trigger success flow (same as regular update)
        setSuccess(true);
        setUpdating(false);

        // Show success message and redirect
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    };

    // Handle conflict resolution errors
    const handleConflictResolutionError = (data) => {
      setUpdating(false);
      setErrors((prev) => ({
        ...prev,
        general: data.error || "Failed to resolve conflict. Please try again.",
      }));

      // Re-enable conflict mode so user can try again
      setConflictMode((prev) => ({
        ...prev,
        active: true,
      }));
    };

    // Register socket event listeners
    socket.on("editingSessionStarted", handleEditingSessionStarted);
    socket.on("editingSessionEnded", handleEditingSessionEnded);
    socket.on("userStartedEditing", handleUserStartedEditing);
    socket.on("userStoppedEditing", handleUserStoppedEditing);
    socket.on("conflictDetected", handleConflictDetected);
    socket.on("conflictResolved", handleConflictResolved);
    socket.on("conflictResolution", handleConflictResolutionError);

    // Cleanup function
    return () => {
      socket.off("editingSessionStarted", handleEditingSessionStarted);
      socket.off("editingSessionEnded", handleEditingSessionEnded);
      socket.off("userStartedEditing", handleUserStartedEditing);
      socket.off("userStoppedEditing", handleUserStoppedEditing);
      socket.off("conflictDetected", handleConflictDetected);
      socket.off("conflictResolved", handleConflictResolved);
      socket.off("conflictResolution", handleConflictResolutionError);
    };
  }, [socket, taskId, navigate]);

  // Heartbeat to keep editing session alive
  useEffect(() => {
    if (!socket?.connected || !taskId || !isEditingSession) return;

    const heartbeatInterval = setInterval(() => {
      socket.emit("heartbeat", { editingTaskId: taskId });
    }, 30000); // Send heartbeat every 30 seconds

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [socket, taskId, isEditingSession]);

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
    } else if (title.trim().length > 20) {
      newErrors.title = "Title must be less than 20 characters";
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      isValid = false;
    } else if (description.trim().length > 100) {
      newErrors.description = "Description must be less than 100 characters";
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
    const priorityChanged = priority !== originalTask.priority;

    const hasChanges =
      titleChanged ||
      descriptionChanged ||
      assignedToChanged ||
      statusChanged ||
      priorityChanged;

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
      if (priorityChanged) updates.priority = priority;

      if (socket?.connected) {
        // Listen for update response
        socket.off("taskUpdated");
        socket.off("taskStatusUpdated");
        socket.off("taskError");

        socket.on("taskUpdated", (data) => {
          const { task, success, error } = data;
          if (success && task) {
            setSuccess(true);
            setOriginalTask(task);
            setTaskVersion(task.version); // Update local version

            setTimeout(() => {
              navigate("/");
            }, 1500);
          } else {
            setErrors((prev) => ({
              ...prev,
              general: error || "Failed to update task",
            }));
          }
        });

        socket.emit("updateTaskWithConflictCheck", {
          taskId,
          updates,
          clientVersion: taskVersion,
        });
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
    } finally {
      setUpdating(false);
    }
  };

  // Handle conflict resolution
  const handleConflictResolution = (resolutionType) => {
    if (!conflictMode.active || !socket?.connected) return;

    let resolution = {};

    switch (resolutionType) {
      case "overwrite":
        resolution = {
          type: "overwrite",
          updates: conflictMode.proposedChanges,
        };
        break;
      case "discard":
        resolution = {
          type: "discard",
        };
        break;
      case "merge":
        // For now, just overwrite - we'll enhance this later
        resolution = {
          type: "merge",
          mergedFields: conflictMode.proposedChanges,
        };
        break;
      default:
        return;
    }

    // Set updating state to show loading
    setUpdating(true);
    setErrors({ title: "", description: "", general: "" });

    socket.emit("resolveConflict", {
      taskId,
      resolution,
    });

    // Reset conflict mode (success will be handled by handleConflictResolved)
    setConflictMode({
      active: false,
      currentTask: null,
      proposedChanges: null,
      conflicts: null,
    });
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
        // End editing session on unmount
        if (taskId && isEditingSession) {
          socket.emit("endEditingTask", { taskId });
        }
      }
    };
  }, [socket, taskId, isEditingSession]);

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
      <div>
        <Header />

        <div className={styles.updateTaskContainer}>
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

              {/* Collaboration indicators */}
              {collaborators.length > 0 && (
                <div className={styles.collaborationIndicator}>
                  <div className={styles.collaborationIcon}>👥</div>
                  <span>
                    {collaborators.length === 1
                      ? `${collaborators[0].userName} is also editing this task`
                      : `${collaborators.length} others are editing this task`}
                  </span>
                </div>
              )}

              {/* Conflict detection notification */}
              {conflictMode.active && (
                <div className={styles.conflictNotification}>
                  <div className={styles.conflictIcon}>⚠️</div>
                  <div className={styles.conflictContent}>
                    <h3>Conflict Detected!</h3>
                    <p>
                      Another user has modified this task while you were
                      editing. Your changes conflict with the latest version.
                    </p>
                    <div className={styles.conflictActions}>
                      <Button
                        onClick={() => handleConflictResolution("overwrite")}
                        variant="primary"
                        size="small"
                      >
                        Keep My Changes
                      </Button>
                      <Button
                        onClick={() => handleConflictResolution("discard")}
                        variant="secondary"
                        size="small"
                      >
                        Discard My Changes
                      </Button>
                      <Button
                        onClick={() =>
                          setConflictMode((prev) => ({
                            ...prev,
                            showDetails: !prev.showDetails,
                          }))
                        }
                        variant="tertiary"
                        size="small"
                      >
                        View Details
                      </Button>
                    </div>

                    {conflictMode.showDetails && (
                      <div className={styles.conflictDetails}>
                        <h4>Conflicting Changes:</h4>
                        {Object.entries(conflictMode.conflicts || {}).map(
                          ([field, conflict]) => (
                            <div key={field} className={styles.conflictField}>
                              <strong>{field}:</strong>
                              <div className={styles.conflictValues}>
                                <div className={styles.currentValue}>
                                  <span>Current: </span>
                                  <span>
                                    {conflict.current?.toString() || "Empty"}
                                  </span>
                                </div>
                                <div className={styles.proposedValue}>
                                  <span>Your change: </span>
                                  <span>
                                    {conflict.proposed?.toString() || "Empty"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form
                onSubmit={handleUpdateTask}
                className={styles.updateTaskForm}
              >
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
                    maxLength={100}
                    placeholder="Provide a detailed description of the task..."
                  />
                  <div className={styles.charCount}>
                    {description.length}/100 characters
                  </div>
                  {errors.description && (
                    <span className={styles.errorText}>
                      {errors.description}
                    </span>
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
                      disabled={updating || success}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
      </div>
    </ProtectedRoutes>
  );
};

export default UpdateTask;
