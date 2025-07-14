import React, { useState, useEffect } from "react";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import Header from "../../components/header/Header";
import TaskBoard from "../../components/task-board/TaskBoard";
import Button from "../../components/button/Button";
import { useNavigate } from "react-router-dom";
import styles from "./dashboard.module.css";
import LogPanel from "../../components/log-panel/LogPanel";
import { Activity, X } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Handle log panel toggle
  const toggleLog = () => {
    setIsLogOpen(!isLogOpen);
  };

  // Close log panel
  const closeLog = () => {
    setIsLogOpen(false);
  };

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeLog();
    }
  };

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeLog();
      }
    };

    if (isLogOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isLogOpen]);

  return (
    <ProtectedRoutes>
      <div>
        <Header />
      </div>

      <div className={styles.taskButtonContainer}>
        <Button onClick={() => navigate("/create-task")}>Create Task</Button>

        {/* Log Panel Toggle Button */}
        <button
          className={styles.logToggle}
          onClick={toggleLog}
          aria-label="Open activity log"
        >
          <Activity size={20} />
        </button>
      </div>

      <div className={styles.dashboardContainer}>
        <div className={styles.taskBoardWrapper}>
          <TaskBoard />
        </div>

        {/* Desktop Log Panel */}
        <div className={styles.logPanelWrapper}>
          <LogPanel />
        </div>
      </div>

      {/* Log Panel Overlay */}
      <>
        <div
          className={`${styles.logOverlay} ${isLogOpen ? styles.show : ""}`}
          onClick={handleOverlayClick}
        />
        <div className={`${styles.logPanel} ${isLogOpen ? styles.show : ""}`}>
          <div className={styles.logHeader}>
            <h2 className={styles.logTitle}>Recent Activity</h2>
            <button
              className={styles.logClose}
              onClick={closeLog}
              aria-label="Close activity log"
            >
              <X size={20} />
            </button>
          </div>
          <div className={styles.logContent}>
            <LogPanel />
          </div>
        </div>
      </>
    </ProtectedRoutes>
  );
};

export default Dashboard;
