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
  lastUpdatedBy,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
  onSmartAssign,
  isDragging,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isStatusUpdated, setIsStatusUpdated] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [prevStatus, setPrevStatus] = useState(status);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Handle status change animation
  useEffect(() => {
    if (prevStatus && prevStatus !== status) {
      // Trigger flip animation on status change
      setIsFlipping(true);
      setIsStatusUpdated(true);

      // Reset animations after completion
      const flipTimer = setTimeout(() => setIsFlipping(false), 600);
      const pulseTimer = setTimeout(() => setIsStatusUpdated(false), 500);

      return () => {
        clearTimeout(flipTimer);
        clearTimeout(pulseTimer);
      };
    }
    setPrevStatus(status);
  }, [status, prevStatus]);

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

  // Menu action handlers with flip animation
  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsFlipping(true);
    setTimeout(() => {
      setIsFlipping(false);
      if (onEdit) onEdit(_id);
    }, 300);
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
    setIsFlipping(true);
    setTimeout(() => {
      setIsFlipping(false);
      if (onSmartAssign) onSmartAssign(_id);
    }, 300);
  };

  // Enhanced drag handlers
  const handleDragStart = (e) => {
    if (onDragStart) {
      onDragStart(e, _id);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  // Touch drag support for mobile with animation
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
        _id,
      );
  };

  const handleTouchEnd = (e) => {
    if (onDragEnd) onDragEnd(e);
  };

  // Build dynamic className for card
  const getCardClassName = () => {
    let className = styles.card;

    if (isDragging) className += ` ${styles.dragging}`;
    if (isFlipping) className += ` ${styles.flipping}`;
    if (isStatusUpdated) className += ` ${styles.statusUpdated}`;
    if (isEntering) className += ` ${styles.entering}`;

    return className;
  };

  // Handle status badge shimmer effect
  const handleStatusClick = () => {
    const statusElement = document.querySelector(
      `[data-task-id="${_id}"] .${styles.status}`,
    );
    if (statusElement) {
      statusElement.classList.add(styles.shimmer);
      setTimeout(() => {
        statusElement.classList.remove(styles.shimmer);
      }, 500);
    }
  };

  return (
    <div
      className={getCardClassName()}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-task-id={_id}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span
          className={styles.status + " " + styles[status?.toLowerCase()] || ""}
          onClick={handleStatusClick}
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
          <strong>Created By:</strong>
          <div>{createdBy?.name}</div>
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
            {lastUpdatedBy?.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
