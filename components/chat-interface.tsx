"use client";

import { useState, useRef, useCallback, FormEvent, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent } from "./ui/card";
import { Sheet } from "./ui/sheet";
import { Progress } from "./ui/progress";
import ReactMarkdown from "react-markdown";
import Sidebar from "./sidebar";
import { toast } from "sonner";
import { Paperclip, Send, Loader2, FileText, Image as ImageIcon, X, BarChart3, Video, Languages, Menu, ArrowRight } from "lucide-react";
import { fileToBase64 } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  base64: string;
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

const STORAGE_KEY = "documind_chats";
const CURRENT_CHAT_KEY = "documind_current_chat";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY);
    if (savedChats) {
      try {
        const history: ChatHistory[] = JSON.parse(savedChats);
        setChatHistory(history.sort((a, b) => b.timestamp - a.timestamp));

        // Load current chat if exists
        const currentChatId = localStorage.getItem(CURRENT_CHAT_KEY);
        if (currentChatId && history.length > 0) {
          const currentChat = history.find((c) => c.id === currentChatId);
          if (currentChat) {
            setMessages(currentChat.messages);
            setCurrentChatId(currentChat.id);
          }
        }
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
  }, []);

  // Auto-save messages to localStorage
  useEffect(() => {
    if (messages.length === 0) return;

    const chatId = currentChatId || Date.now().toString();
    const firstUserMessage = messages.find((m) => m.role === "user");
    const content = firstUserMessage?.content || "";
    const title = content.slice(0, 40) + (content.length > 40 ? "..." : "") || "New Chat";

    const updatedChat: ChatHistory = {
      id: chatId,
      title,
      timestamp: Date.now(),
      messages,
    };

    // Update history list
    setChatHistory((prev) => {
      const filtered = prev.filter((c) => c.id !== chatId);
      const newHistory = [updatedChat, ...filtered].sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      // Dispatch event for sidebar to update
      window.dispatchEvent(new CustomEvent("chat-history-updated"));
      return newHistory;
    });

    setCurrentChatId(chatId);
    localStorage.setItem(CURRENT_CHAT_KEY, chatId);
  }, [messages, currentChatId]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    setInput("");
    setStreamingContent("");
    localStorage.removeItem(CURRENT_CHAT_KEY);
    setIsMobileMenuOpen(false);
    // Dispatch event for sidebar to update
    window.dispatchEvent(new CustomEvent("chat-history-updated"));
  }, []);

  // Load a specific chat
  const loadChat = useCallback((chatId: string) => {
    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chat.id);
      localStorage.setItem(CURRENT_CHAT_KEY, chatId);
      setIsMobileMenuOpen(false);
    }
  }, [chatHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      setMessages([]);
      setCurrentChatId(null);
      setChatHistory([]);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_CHAT_KEY);
      setIsMobileMenuOpen(false);
      // Show success toast
      toast.success("History cleared successfully");
      // Dispatch event for sidebar to update
      window.dispatchEvent(new CustomEvent("chat-history-updated"));
    }
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessingFile(true);
    setUploadProgress(0);

    const newFiles: AttachedFile[] = [];

    for (const file of files) {
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name} (Max 10MB)`);
        continue;
      }

      // Show uploading toast
      toast.loading(`Processing ${file.name}...`, { id: `upload-${file.name}` });

      // Simulate progress animation
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      try {
        const base64 = await fileToBase64(file);
        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          base64,
        });

        toast.success(`File attached: ${file.name}`, {
          id: `upload-${file.name}`,
          description: "Ready for analysis",
        });
      } catch (error) {
        console.error("Error processing file:", error);
        toast.error(`Failed to process ${file.name}`, {
          id: `upload-${file.name}`,
        });
      }
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    setUploadProgress(0);
    setIsProcessingFile(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!input.trim() && attachedFiles.length === 0) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: input,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setStreamingContent("");
      // Triple Lock #3: Force blur on mobile to dismiss keyboard
      if (window.innerWidth < 768) {
        (document.activeElement as HTMLElement)?.blur();
      }
      inputRef.current?.blur();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            files: attachedFiles.length > 0 ? JSON.stringify(attachedFiles) : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          fullContent += text;
          setStreamingContent(text);
        }

        // Add complete assistant message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: fullContent,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
        setAttachedFiles([]);
      } catch (error) {
        console.error("Chat error:", error);

        // Extract error message from response if available
        let errorText = "抱歉，发生了错误。请稍后再试。";
        if (error instanceof Error && error.message) {
          // Check if it's a fetch error with response
          const fetchError = error as any;
          if (fetchError.cause && fetchError.cause.data) {
            try {
              const errorData = JSON.parse(fetchError.cause.data);
              errorText = `错误: ${errorData.error || errorText}`;
              if (errorData.details) {
                errorText += `\n\n${errorData.details}`;
              }
            } catch {
              errorText = error.message;
            }
          } else {
            errorText = error.message;
          }
        }

        // Add error message
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: errorText,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    },
    [messages, input, attachedFiles, scrollToBottom]
  );

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <Sidebar
        isMobile={false}
        currentChatId={currentChatId}
        onLoadChat={loadChat}
        onNewChat={startNewChat}
        onClearHistory={clearHistory}
      />

      {/* Main Chat Interface */}
      <div
        className="flex flex-col h-screen bg-paper relative flex-1 overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Global Drag Overlay */}
        {isDragging && (
        <div className="fixed inset-0 bg-terra/10 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-terra border-dashed m-4 rounded-3xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-terra rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Paperclip className="w-10 h-10 text-white" />
            </div>
            <p className="text-2xl font-serif font-semibold text-terra mb-2">Drop files here</p>
            <p className="text-sm text-ink/60">Supports images, PDFs, and videos</p>
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-card-cream rounded-lg shadow-sm border border-text-ink/10 hover:bg-terra/10 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-ink" />
      </button>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <Sidebar
          isMobile={true}
          onClose={() => setIsMobileMenuOpen(false)}
          currentChatId={currentChatId}
          onLoadChat={loadChat}
          onNewChat={startNewChat}
          onClearHistory={clearHistory}
        />
      </Sheet>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-8 py-6">
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)] px-4 py-12">
              {/* Hero Title */}
              <div className="mb-12 text-center">
                <h1 className="text-4xl font-serif font-bold mb-3" style={{ color: "#2D2D2D" }}>
                  Your Research Companion
                </h1>
                <p className="font-light" style={{ color: "rgba(45,45,45,0.7)" }}>
                  Ready to uncover new insights from your documents?
                </p>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
                {/* Card 1 */}
                <button
                  onClick={() => setInput("Summarize this contract")}
                  className="flex flex-col h-40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="h-1/2 flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#D99B83" }}>
                    <FileText className="w-8 h-8 text-white stroke-[1.5px]" />
                    <ArrowRight className="w-5 h-5 text-white opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="h-1/2 flex flex-col justify-center px-5 py-3" style={{ backgroundColor: "#FDFBF7" }}>
                    <h3 className="font-serif text-base font-semibold" style={{ color: "#2D2D2D" }}>Summarize this contract</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#6B6B6B" }}>Extract key points from legal documents</p>
                  </div>
                </button>

                {/* Card 2 */}
                <button
                  onClick={() => setInput("Analyze this financial chart")}
                  className="flex flex-col h-40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="h-1/2 flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#D99B83" }}>
                    <BarChart3 className="w-8 h-8 text-white stroke-[1.5px]" />
                    <ArrowRight className="w-5 h-5 text-white opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="h-1/2 flex flex-col justify-center px-5 py-3" style={{ backgroundColor: "#FDFBF7" }}>
                    <h3 className="font-serif text-base font-semibold" style={{ color: "#2D2D2D" }}>Analyze this financial chart</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#6B6B6B" }}>Get insights from data visualizations</p>
                  </div>
                </button>

                {/* Card 3 */}
                <button
                  onClick={() => setInput("Extract insights from video")}
                  className="flex flex-col h-40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="h-1/2 flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#D99B83" }}>
                    <Video className="w-8 h-8 text-white stroke-[1.5px]" />
                    <ArrowRight className="w-5 h-5 text-white opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="h-1/2 flex flex-col justify-center px-5 py-3" style={{ backgroundColor: "#FDFBF7" }}>
                    <h3 className="font-serif text-base font-semibold" style={{ color: "#2D2D2D" }}>Extract insights from video</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#6B6B6B" }}>Analyze video frames and content</p>
                  </div>
                </button>

                {/* Card 4 */}
                <button
                  onClick={() => setInput("Translate this document")}
                  className="flex flex-col h-40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="h-1/2 flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#D99B83" }}>
                    <Languages className="w-8 h-8 text-white stroke-[1.5px]" />
                    <ArrowRight className="w-5 h-5 text-white opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="h-1/2 flex flex-col justify-center px-5 py-3" style={{ backgroundColor: "#FDFBF7" }}>
                    <h3 className="font-serif text-base font-semibold" style={{ color: "#2D2D2D" }}>Translate this document</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#6B6B6B" }}>Convert content to any language</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                console.log('[Frontend] Rendering message:', message.role, 'Content length:', message.content?.length || 0);
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-4",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FDFBF7", border: "1px solid rgba(217,155,131,0.3)" }}>
                        <FileText className="w-5 h-5" style={{ color: "#D99B83" }} />
                      </div>
                    )}
                    <div
                      className={cn(
                        "px-4 py-3 max-w-[80%]",
                        message.role === "user"
                          ? "rounded-2xl rounded-tr-sm"
                          : "rounded-2xl"
                      )}
                      style={
                        message.role === "user"
                          ? { backgroundColor: "#D99B83", color: "white" }
                          : { backgroundColor: "#FDFBF7", border: "1px solid rgba(217,155,131,0.3)", color: "#2D2D2D" }
                      }
                    >
                      {message.role === "assistant" ? (
                        message.content ? (
                          <div className="prose prose-sm md:prose-base max-w-none break-words text-sm md:text-base">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: "#2D2D2D" }}>{children}</p>,
                                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc" style={{ color: "#2D2D2D" }}>{children}</ul>,
                                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal" style={{ color: "#2D2D2D" }}>{children}</ol>,
                                li: ({ children }) => <li className="mb-1" style={{ color: "#2D2D2D" }}>{children}</li>,
                                code: ({ children }) => <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "rgba(217,155,131,0.2)", color: "#2D2D2D" }}>{children}</code>,
                                pre: ({ children }) => <pre className="p-3 rounded-lg overflow-x-auto text-xs md:text-sm my-2" style={{ backgroundColor: "#2D2D2D", color: "#FDFBF7" }}>{children}</pre>,
                                h1: ({ children }) => <h1 className="text-lg font-serif font-bold mb-2" style={{ color: "#2D2D2D" }}>{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-serif font-bold mb-2" style={{ color: "#2D2D2D" }}>{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-serif font-bold mb-1" style={{ color: "#2D2D2D" }}>{children}</h3>,
                                a: ({ children, href }) => <a href={href} className="underline font-medium" style={{ color: "#D99B83" }} target="_blank" rel="noopener noreferrer">{children}</a>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 pl-3 italic my-2" style={{ borderColor: "rgba(217,155,131,0.4)", color: "rgba(45,45,45,0.7)" }}>{children}</blockquote>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span className="italic" style={{ color: "#9CA3AF" }}>Thinking...</span>
                        )
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming message */}
              {(streamingContent || isLoading) && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FDFBF7", border: "1px solid rgba(217,155,131,0.3)" }}>
                    <FileText className="w-5 h-5" style={{ color: "#D99B83" }} />
                  </div>
                  <div className="rounded-2xl px-4 py-3 max-w-[80%]" style={{ backgroundColor: "#FDFBF7", border: "1px solid rgba(217,155,131,0.3)" }}>
                    <p className="text-sm" style={{ color: "#2D2D2D" }}>
                      {streamingContent || <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#D99B83" }} />}
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Journal Style */}
      <div className="px-6 pb-6 bg-card-cream">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 bg-bg-sidebar rounded-full px-4 py-2 text-sm shadow-sm border border-text-ink/10"
              >
                {getFileIcon(file.type)}
                <span className="text-ink max-w-[200px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-ink/50 hover:text-terra transition-colors"
                  disabled={isProcessingFile}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress Bar */}
        {isProcessingFile && (
          <div className="mb-3">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-ink/50 mt-1 text-center">Processing file... {uploadProgress}%</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          {/* Journal Style Input */}
          <div
            className="relative flex items-center gap-2 rounded-xl p-3 transition-colors"
            style={{
              backgroundColor: "#FDFBF7",
              border: "2px dashed #D99B83",
              boxShadow: "4px 4px 0px 0px rgba(217,155,131,0.2)"
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-all"
              disabled={isLoading || isProcessingFile}
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5 stroke-[1.5px]" />
            </button>

            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write your thoughts..."
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-base md:text-sm py-2 px-2 placeholder-gray-400"
              style={{ color: "#2D2D2D" }}
              disabled={isLoading || isProcessingFile}
            />

            <button
              type="submit"
              disabled={isLoading || isProcessingFile || (!input.trim() && attachedFiles.length === 0)}
              className="p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              style={{ color: "#D99B83" }}
              aria-label="Send message"
            >
              {isLoading || isProcessingFile ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 stroke-[1.5px]" />
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessingFile}
          />
        </form>

        <p className="text-xs text-ink/40 mt-3 text-center font-light">
          Press Enter to send · Drag & drop files anywhere
        </p>
      </div>
    </div>
    </div>
  );
}
