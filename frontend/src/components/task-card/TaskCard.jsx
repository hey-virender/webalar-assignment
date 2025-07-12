import React from "react";
import styles from "./task-card.module.css";

const TaskCard = ({
  title,
  description,
  status,
  createdBy,
  assignedTo,
  createdAt,
  updatedAt,
  updatedBy,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span
          className={styles.status + " " + styles[status?.toLowerCase()] || ""}
        >
          {status}
        </span>
      </div>
      <p className={styles.description}>{description}</p>
      <div className={styles.meta}>
        <div>
          <strong>Created By:</strong> {createdBy}
        </div>
        <div>
          <strong>Assigned To:</strong> {assignedTo}
        </div>
      </div>
      <div className={styles.dates}>
        <div>
          <strong>Created:</strong> {new Date(createdAt).toLocaleString()}
        </div>
        {updatedAt && (
          <div>
            <strong>Updated:</strong> {new Date(updatedAt).toLocaleString()} by{" "}
            {updatedBy}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
