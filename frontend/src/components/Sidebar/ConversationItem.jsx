import React, { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useConversations } from "../../context/ConversationContext";
import Modal from "../common/Modal";
import styles from "./Sidebar.module.css";

export default function ConversationItem({ conversation, isActive, onSelect }) {
  const { renameConversation, deleteConversation } = useConversations();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(
    conversation.title || "Conversation",
  );
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsEditing(true);
    setEditTitle(conversation.title || "");
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleCommitEdit = async () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      await renameConversation(conversation.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") handleCommitEdit();
    if (e.key === "Escape") setIsEditing(false);
  };

  const handleOpenDeleteModal = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteConversation(conversation.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <li
        className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ""}`}
        onClick={!isEditing ? onSelect : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => !isEditing && e.key === "Enter" && onSelect()}
        aria-pressed={isActive}
      >
        <span className={styles.conversationIcon} aria-hidden="true">
          <MessageSquare size={14} />
        </span>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleCommitEdit}
            onKeyDown={handleEditKeyDown}
            className={styles.renameInput}
            aria-label="Rename conversation"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className={styles.conversationTitle} title={conversation.title}>
            {conversation.title || "Conversation"}
          </span>
        )}

        <div className={styles.itemActions} ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Conversation options"
            aria-expanded={menuOpen}
          >
            ⋮
          </button>
          {menuOpen && (
            <div className={styles.dropdownMenu}>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={handleStartEdit}
              >
                Rename
              </button>
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={handleOpenDeleteModal}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </li>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Delete conversation?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete &ldquo;{conversation.title || "this conversation"}&rdquo;?
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
