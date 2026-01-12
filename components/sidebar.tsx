"use client";

import { useState, useEffect } from "react";
import { FileText, Clock, Settings, Sparkles, Plus, Trash2, BookOpen } from "lucide-react";
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
        } else {
          // Clear history when localStorage is empty
          setHistory([]);
        }
      } catch (e) {
        console.error("Error loading history:", e);
        setHistory([]);
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
      {/* Logo & Brand Area */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-card-cream rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen className="w-6 h-6 text-terra" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-ink">Documind AI</h1>
            <p className="text-xs text-ink/60 font-light">Document Analyst</p>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-terra/10 text-ink hover:bg-terra/20 transition-all border border-terra/30"
        >
          <Plus className="w-5 h-5 stroke-[1.5px]" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-ink/50 stroke-[1.5px]" />
            <h2 className="text-xs font-medium text-ink/50 uppercase tracking-wide">
              Recent Chats
            </h2>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-ink/50 hover:text-terra transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
              Clear
            </button>
          )}
        </div>

        <div className="space-y-1">
          {history.length === 0 ? (
            <div className="px-3 py-8 text-center text-ink/50 text-sm">
              No chat history yet.<br />Start a new conversation!
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "w-full text-left py-2.5 pr-3 transition-colors group",
                  currentChatId === item.id
                    ? "border-l-4 border-terra pl-3"
                    : "border-l-4 border-transparent pl-3 hover:bg-card-cream/50"
                )}
                onClick={() => handleLoadChat(item.id)}
              >
                <div className="flex items-start gap-3">
                  <FileText className={cn(
                    "w-4.5 h-4.5 flex-shrink-0 mt-0.5 stroke-[1.5px]",
                    currentChatId === item.id ? "text-terra" : "text-ink/40 group-hover:text-ink/60"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm truncate",
                      currentChatId === item.id ? "font-semibold text-ink" : "font-medium text-ink/70 group-hover:text-ink"
                    )}>
                      {item.title}
                    </p>
                    <p className="text-xs text-ink/40 mt-0.5">{formatTimestamp(item.timestamp)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer Area */}
      <div className="p-4 border-t border-text-ink/10">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card-cream border border-text-ink/10 hover:border-terra/30 transition-all group mb-2">
          <Sparkles className="w-4 h-4 text-terra stroke-[1.5px]" />
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-ink/50">Model</p>
            <p className="text-sm font-medium text-ink group-hover:text-terra transition-colors">
              Gemini 2.5 Flash
            </p>
          </div>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card-cream/50 transition-colors group">
          <Settings className="w-4 h-4 text-ink/50 group-hover:text-ink stroke-[1.5px]" />
          <span className="text-sm font-medium text-ink/60 group-hover:text-ink">
            Settings
          </span>
        </button>
      </div>
    </>
  );

  if (!isMobile) {
    return (
      <aside className="hidden md:flex w-64 bg-sidebar flex-col h-screen flex-shrink-0">
        {sidebarContent}
      </aside>
    );
  }

  return <div className="w-64 bg-sidebar flex flex-col h-full">{sidebarContent}</div>;
}
