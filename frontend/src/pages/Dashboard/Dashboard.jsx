import React from 'react'
import ProtectedRoutes from '../../components/ProtectedRoutes'
import Header from '../../components/header/Header'
import TaskBoard from '../../components/task-board/TaskBoard'
import Button from '../../components/button/Button'
import { useNavigate } from 'react-router-dom'
import styles from './dashboard.module.css'
import LogPanel from '../../components/log-panel/LogPanel'

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <ProtectedRoutes>
      <div>
        <Header />
        
      </div>
      <div className={styles.taskButtonContainer}>
          <Button onClick={() => navigate('/create-task')}>Create Task</Button>
        </div>
      <div className={styles.dashboardContainer}>
        
        <TaskBoard/>
        <LogPanel/>
      </div>
    </ProtectedRoutes>
  )
}

export default Dashboard