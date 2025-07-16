import React, { useEffect, useState } from "react";
import styles from "./log-panel.module.css";
import useAxios from "../../hooks/useAxios";
import { useSocket } from "../../hooks/useSocket";

const LogPanel = () => {
  const [logs, setLogs] = useState([]);
  const { socket } = useSocket();
  const axios = useAxios();

  const fetchLogs = async () => {
    try {
      const response = await axios.get("/logs");
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  //Intial fetch to show logs

  useEffect(() => {
    fetchLogs();
  }, []);

  //Listen to socket events to update logs
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdate = () => {
      fetchLogs();
    };

    socket.on("taskStatusUpdated", handleTaskUpdate);
    socket.on("taskCreated", handleTaskUpdate);
    socket.on("taskAssigned", handleTaskUpdate);
    socket.on("taskDeleted", handleTaskUpdate);
    socket.on("taskUpdated", handleTaskUpdate);

    // Cleanup listeners
    return () => {
      socket.off("taskStatusUpdated", handleTaskUpdate);
      socket.off("taskCreated", handleTaskUpdate);
      socket.off("taskAssigned", handleTaskUpdate);
      socket.off("taskDeleted", handleTaskUpdate);
      socket.off("taskUpdated", handleTaskUpdate);
    };
  }, [socket]);

  return (
    <section className={styles.logPanel}>
      <div>
        <h2>Recent Activity</h2>
      </div>
      <div className={styles.logContainer}>
        {logs.length === 0 ? (
          <p className={styles.noLogs}>No activity yet</p>
        ) : (
          logs.map((log) => (
            <div key={log._id} className={styles.logEntry}>
              <div className={styles.logHeader}>
                <h3 className={styles.logAction} data-action={log.action}>
                  {log.action.replace("_", " ")}
                </h3>
                <span className={styles.logTime}>
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={styles.logBody}>
                <p className={styles.logUser}>
                  <strong>{log.performedBy?.name || "Unknown User"}</strong>
                </p>
                <p className={styles.logDetails}>{log.details}</p>
                {log.taskId?.title && (
                  <p className={styles.logTask}>
                    Task: <em>{log.taskId.title}</em>
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default LogPanel;
