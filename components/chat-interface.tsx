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
import { Paperclip, Send, Loader2, FileText, Image as ImageIcon, X, BarChart, Video, Languages, Menu } from "lucide-react";
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
        className="flex flex-col h-screen bg-white relative flex-1 overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Global Drag Overlay */}
        {isDragging && (
        <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-3xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Paperclip className="w-10 h-10 text-white" />
            </div>
            <p className="text-2xl font-semibold text-blue-600 mb-2">Drop files here</p>
            <p className="text-sm text-gray-500">Supports images, PDFs, and videos</p>
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600" />
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
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Start a new analysis
                </h1>
                <p className="text-gray-500">
                  Upload a document or ask a question to get started
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <Card className="group cursor-pointer border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Summarize this contract</p>
                      <p className="text-sm text-gray-500">Extract key points from legal documents</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer border-gray-200 hover:border-violet-200 hover:bg-violet-50/30 transition-all duration-200">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                      <BarChart className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Analyze this financial chart</p>
                      <p className="text-sm text-gray-500">Get insights from data visualizations</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                      <Video className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Extract insights from video</p>
                      <p className="text-sm text-gray-500">Analyze video frames and content</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer border-gray-200 hover:border-amber-200 hover:bg-amber-50/30 transition-all duration-200">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                      <Languages className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Translate this document</p>
                      <p className="text-sm text-gray-500">Convert content to any language</p>
                    </div>
                  </CardContent>
                </Card>
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
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 max-w-[80%]",
                        message.role === "user"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      {message.role === "assistant" ? (
                        message.content ? (
                          <div className="prose prose-sm md:prose-base max-w-none break-words text-sm md:text-base">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{children}</code>,
                                pre: ({ children }) => <pre className="bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto text-xs md:text-sm my-2">{children}</pre>,
                                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                                a: ({ children, href }) => <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2">{children}</blockquote>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Thinking...</span>
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
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-gray-900">
                      {streamingContent || <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-6 pb-6 bg-white">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 text-sm shadow-sm border border-gray-200"
              >
                {getFileIcon(file.type)}
                <span className="text-gray-700 max-w-[200px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isProcessingFile}
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
            <p className="text-xs text-gray-500 mt-1 text-center">Processing file... {uploadProgress}%</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center gap-2 shadow-lg rounded-full bg-white border border-gray-200 p-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              disabled={isLoading || isProcessingFile}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your document..."
              className="flex-1 bg-transparent border-0 outline-none text-base md:text-sm py-3 px-2 text-gray-900 placeholder:text-gray-400"
              disabled={isLoading || isProcessingFile}
            />

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || isProcessingFile || (!input.trim() && attachedFiles.length === 0)}
              className="h-11 w-11 rounded-full bg-gray-900 hover:bg-gray-800 transition-all"
            >
              {isLoading || isProcessingFile ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
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

        <p className="text-xs text-gray-400 mt-3 text-center">
          Press Enter to send, Shift + Enter for new line · Drag & drop files anywhere
        </p>
      </div>
    </div>
    </div>
  );
}
