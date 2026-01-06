"use client";

import { useState, useEffect } from "react";
import { FileText, Clock, Settings, Sparkles, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  currentChatId?: string | null;
  onLoadChat?: (chatId: string) => void;
  onNewChat?: () => void;
  onClearHistory?: () => void;
}

const STORAGE_KEY = "documind_chats";

export default function Sidebar({
  isMobile = false,
  onClose,
  currentChatId,
  onLoadChat,
  onNewChat,
  onClearHistory,
}: SidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedChats = localStorage.getItem(STORAGE_KEY);
        if (savedChats) {
          const parsed: HistoryItem[] = JSON.parse(savedChats);
          setHistory(parsed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
        }
      } catch (e) {
        console.error("Error loading history:", e);
      }
    };

    loadHistory();

    // Listen for storage changes (for sync across tabs)
    const handleStorageChange = () => loadHistory();
    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events for same-tab updates
    const handleCustomUpdate = () => loadHistory();
    window.addEventListener("chat-history-updated", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("chat-history-updated", handleCustomUpdate);
    };
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNewChat = () => {
    onNewChat?.();
    onClose?.();
  };

  const handleLoadChat = (id: string) => {
    onLoadChat?.(id);
    onClose?.();
  };

  const handleClearHistory = () => {
    onClearHistory?.();
    onClose?.();
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 transition-all shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">New Chat</span>
        </button>

        <div className="flex items-center gap-3 mt-4 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Documind AI</h1>
            <p className="text-xs text-gray-500">Document Analyst</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-2 mb-3 px-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Recent Chats
            </h2>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        <div className="space-y-1">
          {history.length === 0 ? (
            <div className="px-3 py-6 text-center text-gray-500 text-sm">
              No chat history yet.<br />Start a new conversation!
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl transition-colors group",
                  currentChatId === item.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-100"
                )}
                onClick={() => handleLoadChat(item.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors",
                    currentChatId === item.id
                      ? "bg-white border-blue-200"
                      : "bg-white border-gray-200 group-hover:border-gray-300"
                  )}>
                    <FileText className={cn(
                      "w-4 h-4",
                      currentChatId === item.id ? "text-blue-600" : "text-gray-500 group-hover:text-gray-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      currentChatId === item.id ? "text-blue-700" : "text-gray-700 group-hover:text-gray-900"
                    )}>
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(item.timestamp)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 hover:border-blue-200 transition-all group mb-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-gray-500">Model</p>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
              Gemini 2.5 Flash
            </p>
          </div>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-gray-300 transition-colors">
            <Settings className="w-4 h-4 text-gray-500 group-hover:text-gray-600" />
          </div>
          <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
            Settings
          </span>
        </button>
      </div>
    </>
  );

  if (!isMobile) {
    return (
      <aside className="hidden md:flex w-64 bg-gray-50 border-r border-gray-200 flex-col h-screen flex-shrink-0">
        {sidebarContent}
      </aside>
    );
  }

  return <div className="w-64 bg-gray-50 flex flex-col h-full">{sidebarContent}</div>;
}
