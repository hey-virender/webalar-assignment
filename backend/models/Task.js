import mongoose from "mongoose";


const taskSchema = new mongoose.Schema({
  title:{
    type:String,
    required:true,

  },
  description:{
    type:String,
    required:true,
  },
  status:{
    type:String,
    enum:["todo","inProgress","completed"],
    default:"todo",
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
  },
  assignedTo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  lastUpdatedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
  }

},{timestamps:true})


const Task = mongoose.models.Task || mongoose.model("Task",taskSchema);


export default Task;