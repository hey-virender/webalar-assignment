import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Input from '../../components/input/Input';

const UpdateTask = () => {
  const {taskId} = useParams()
  const [task, setTask] = useState(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    const fetchTask = async () => {
      const response = await axiosInstance.get(`/task/${taskId}`)
      setTask(response.data.task)
      setTitle(response.data.task.title)
      setDescription(response.data.task.description)
      setAssignedTo(response.data.task.assignedTo)
      setStatus(response.data.task.status)
    }
    fetchTask()
  }, [taskId])
 
  const handleUpdateTask = async () => {
    console.log(task)
  }
  return (
    <ProtectedRoutes>
        <div>
            <Header/>
            <div>
              <h1>Update Task</h1>
              <div>
                <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Input label="Assigned To" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
                <Input label="Status" value={status} onChange={(e) => setStatus(e.target.value)} />
                <Button onClick={handleUpdateTask}>Update Task</Button>
              </div>
                
            </div>
        </div>
    </ProtectedRoutes>
  )
}

export default UpdateTask