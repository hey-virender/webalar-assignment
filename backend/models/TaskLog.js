import mongoose from "mongoose";

const taskLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "status_changed",
        "assigned",
        "unassigned",
        "deleted",
        "smart_assigned",
      ],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changes: {
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
    },
    details: {
      type: String,
    },
    taskSnapshot: {
      title: String,
      description: String,
      status: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  { timestamps: true },
);

taskLogSchema.index({ taskId: 1, createdAt: -1 });
taskLogSchema.index({ performedBy: 1, createdAt: -1 });

const TaskLog =
  mongoose.models.TaskLog || mongoose.model("TaskLog", taskLogSchema);

export default TaskLog;
