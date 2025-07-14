import TaskLog from "../models/TaskLog.js";

export const getLogs = async (req, res) => {
  try {
    const logs = await TaskLog.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "performedBy",
        select: "name",
      })
      .limit(20);
    res.status(200).json(logs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching logs" });
  }
};
