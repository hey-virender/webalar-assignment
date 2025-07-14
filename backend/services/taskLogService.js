import TaskLog from "../models/TaskLog.js";
import User from "../models/User.js";

export class TaskLogService {
  /**
   * Log a task action with detailed information
   * @param {Object} params - Logging parameters
   * @param {string} params.taskId - ID of the task
   * @param {string} params.action - Type of action performed
   * @param {string} params.performedBy - ID of user who performed the action
   * @param {Object} params.changes - Changes made (optional)
   * @param {string} params.details - Additional details (optional)
   * @param {Object} params.taskSnapshot - Current state of task (optional)
   */
  static async logAction({
    taskId,
    action,
    performedBy,
    changes = null,
    details = null,
    taskSnapshot = null,
  }) {
    try {
      const logEntry = new TaskLog({
        taskId,
        action,
        performedBy,
        changes,
        details,
        taskSnapshot,
      });

      await logEntry.save();
      console.log(
        `Task action logged: ${action} for task ${taskId} by user ${performedBy}`,
      );
      return logEntry;
    } catch (error) {
      console.error("Error logging task action:", error);
      throw error;
    }
  }

  /**
   * Log task creation
   */
  static async logTaskCreated(task, createdBy) {
    return this.logAction({
      taskId: task._id,
      action: "created",
      performedBy: createdBy,
      details: `Task "${task.title}" created`,
      taskSnapshot: {
        title: task.title,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo,
      },
    });
  }

  /**
   * Log task status change
   */
  static async logStatusChange(task, oldStatus, newStatus, performedBy) {
    return this.logAction({
      taskId: task._id,
      action: "status_changed",
      performedBy,
      changes: {
        field: "status",
        oldValue: oldStatus,
        newValue: newStatus,
      },
      details: `Status changed from "${oldStatus}" to "${newStatus}"`,
      taskSnapshot: {
        title: task.title,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo,
      },
    });
  }

  /**
   * Log task assignment
   */
  static async logTaskAssigned(
    task,
    oldAssignee,
    newAssignee,
    performedBy,
    isSmartAssign = false,
  ) {
    const action = isSmartAssign ? "smart_assigned" : "assigned";
    const details = oldAssignee
      ? `Task reassigned from ${oldAssignee} to ${newAssignee}`
      : `Task assigned to ${newAssignee}`;

    return this.logAction({
      taskId: task._id,
      action,
      performedBy,
      changes: {
        field: "assignedTo",
        oldValue: oldAssignee,
        newValue: newAssignee,
      },
      details: isSmartAssign ? `Smart ${details}` : details,
      taskSnapshot: {
        title: task.title,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo,
      },
    });
  }

  /**
   * Log task update (title, description, etc.)
   */
  static async logTaskUpdated(task, changes, performedBy) {
    const changedFields = Object.keys(changes);
    console.log("changes", changes);
    console.log("changedFields", changedFields);
    let details = `Updated fields: ${changedFields.join(", ")}`;
  
    if (changedFields.includes("assignedTo")) {
      const oldAssigneeUser = await User.findById(task.assignedTo).select(
        "name",
      );
      const newAssigneeUser = await User.findById(changes.assignedTo).select(
        "name",
      );
      const oldAssignee = oldAssigneeUser ? oldAssigneeUser.name : "Unassigned";
      const newAssignee = newAssigneeUser ? newAssigneeUser.name : "Unassigned";
      details = `Task reassigned from ${oldAssignee} to ${newAssignee} `;
    }

    return this.logAction({
      taskId: task._id,
      action: "updated",
      performedBy,
      changes: {
        field: changedFields.join(","),
        oldValue: JSON.stringify(changes.old || {}),
        newValue: JSON.stringify(changes.new || {}),
      },
      details,
      taskSnapshot: {
        title: task.title,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo,
      },
    });
  }

  /**
   * Log task deletion
   */
  static async logTaskDeleted(task, performedBy) {
    return this.logAction({
      taskId: task._id,
      action: "deleted",
      performedBy,
      details: `Task "${task.title}" deleted`,
      taskSnapshot: {
        title: task.title,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo,
      },
    });
  }

  /**
   * Get task history/logs
   */
  static async getTaskHistory(taskId, limit = 50) {
    try {
      const logs = await TaskLog.find({ taskId })
        .populate("performedBy", "name email")
        .populate("taskSnapshot.assignedTo", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error("Error fetching task history:", error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(userId, limit = 50) {
    try {
      const logs = await TaskLog.find({ performedBy: userId })
        .populate("taskId", "title")
        .populate("performedBy", "name email")
        .sort({ createdAt: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error("Error fetching user activity:", error);
      throw error;
    }
  }
}
