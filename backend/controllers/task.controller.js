import Task from "../models/Task.js";
import User from "../models/User.js";

export const createTask = async (req, res) => {
  try {
    if(!req.session.user){
      return res.status(401).json({message:"Unauthorized"});
    }
    const userId = req.session.user.id;
    const { title, description, assignedTo } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ message: "Assigned user not found" });
      }
    }
    const task = await Task.create({
      title,
      description,
      assignedTo,
      createdBy: userId,
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTasks = async (req, res) => {
  try {
    if(!req.session.user){
      return res.status(401).json({message:"Unauthorized"});
    }
    const tasks = await Task.find();
    res.status(200).json({ tasks });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    if(!req.session.user){
      return res.status(401).json({message:"Unauthorized"});
    }
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const assignTask = async (req, res) => {
  try {
    if(!req.session.user){
      return res.status(401).json({message:"Unauthorized"});
    }
    const taskId = req.params.id;
    const { assignedTo } = req.body;
    if (!assignedTo) {
      return res.status(400).json({ message: "Assigned user is required" });
    }
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ message: "Assigned user not found" });
      }
    }
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.status === "completed") {
      return res.status(400).json({ message: "Task is already completed" });
    }
    task.assignedTo = assignedTo;
    task.lastUpdatedBy = req.user.id;
    await task.save();
    res.status(200).json({ message: "Task assigned successfully", task });
  } catch (error) {
    console.log(error);
  }
};

export const smartAssign = async (req, res) => {
  try {
    if(!req.session.user){
      return res.status(401).json({message:"Unauthorized"});
    }
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    const users = await User.find();
  
    const userTaskCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Task.countDocuments({
          assignedTo: user._id,
          status: { $in: ["inprogress", "todo"] },
        });
        return { user, count };
      }),
    );
   
    const minCount = Math.min(...userTaskCounts.map((u) => u.count));
    const candidates = userTaskCounts.filter((u) => u.count === minCount);
   
    const selectedUser = candidates[0].user;
 
    task.assignedTo = selectedUser._id;
    task.lastUpdatedBy = req.user.id;
    await task.save();
    res
      .status(200)
      .json({
        message: "Task smart-assigned successfully",
        task,
        assignedTo: selectedUser,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
