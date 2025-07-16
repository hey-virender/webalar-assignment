import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["todo", "inProgress", "completed"],
      default: "todo",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Version control for conflict resolution
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    
    // Track active editing sessions for real-time collaboration
    editingSessions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        startedAt: {
          type: Date,
          default: Date.now,
        },
        lastActivity: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;
