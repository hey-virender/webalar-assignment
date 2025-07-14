import React, { useState, useRef, useEffect } from "react";
import styles from "./task-card.module.css";
import { EllipsisVertical, Edit3, Trash2, Zap } from "lucide-react";

const TaskCard = ({
  _id,
  title,
  description,
  status,
  createdBy,
  assignedTo,
  createdAt,
  updatedAt,
  updatedBy,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
  onSmartAssign,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  // Toggle menu visibility
  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  // Menu action handlers
  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onEdit) onEdit(_id);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) onDelete(_id);
  };

  const handleSmartAssign = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onSmartAssign) onSmartAssign(_id);
  };

  // Touch drag support for mobile
  const handleTouchStart = (e) => {
    if (onDragStart)
      onDragStart(
        {
          dataTransfer: {
            setData: () => {},
            effectAllowed: "move",
          },
          preventDefault: () => {},
          target: e.target,
          type: "touchstart",
        },
        null,
      );
  };
  const handleTouchEnd = (e) => {
    if (onDragEnd) onDragEnd(e);
  };
  return (
    <div
      className={styles.card}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span
          className={styles.status + " " + styles[status?.toLowerCase()] || ""}
        >
          {status}
        </span>
      </div>

      {/* Dropdown Menu */}
      <div className={styles.menuContainer} ref={dropdownRef}>
        <button
          ref={menuRef}
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-label="Task options"
        >
          <EllipsisVertical size={16} />
        </button>

        {isMenuOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownItem} onClick={handleEdit}>
              <Edit3 size={14} />
              <span>Edit Task</span>
            </div>
            <div className={styles.dropdownItem} onClick={handleSmartAssign}>
              <Zap size={14} />
              <span>Smart Assign</span>
            </div>
            <div
              className={`${styles.dropdownItem} ${styles.danger}`}
              onClick={handleDelete}
            >
              <Trash2 size={14} />
              <span>Delete Task</span>
            </div>
          </div>
        )}
      </div>
      <p className={styles.description}>{description}</p>
      <div className={styles.meta}>
        <div>
          <strong>Created By:</strong> {createdBy.name}
        </div>
        <div>
          <strong>Assigned To:</strong>
          <div>{assignedTo ? assignedTo.name : "Unassigned"}</div>
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
