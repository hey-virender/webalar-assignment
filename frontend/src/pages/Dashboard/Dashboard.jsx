import React from 'react'
import ProtectedRoutes from '../../components/ProtectedRoutes'
import Header from '../../components/header/header'
import TaskCard from '../../components/task-card/TaskCard'

const Dashboard = () => {
  return (
    <ProtectedRoutes>
      <div>
        <Header />
        <h1>Dashboard</h1>
      </div>
      <div>
        <TaskCard title="Task 1" description="Description 1" status="todo" createdBy="John Doe" assignedTo="Jane Doe" createdAt="2021-01-01" updatedAt="2021-01-01" updatedBy="John Doe" />
      </div>
    </ProtectedRoutes>
  )
}

export default Dashboard