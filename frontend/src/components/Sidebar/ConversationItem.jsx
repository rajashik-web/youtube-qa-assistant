import React, { useRef, useState } from "react";
import { useConversations } from "../../context/ConversationContext";
import styles from "./Sidebar.module.css";

export default function ConversationItem({ conversation, isActive, onSelect }) {
  const { renameConversation, deleteConversation } = useConversations();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(
    conversation.title || "Conversation",
  );
  const inputRef = useRef(null);

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

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    await deleteConversation(conversation.id);
  };

  return (
    <li
      className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ""}`}
      onClick={!isEditing ? onSelect : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => !isEditing && e.key === "Enter" && onSelect()}
      aria-pressed={isActive}
    >
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

      <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
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
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
