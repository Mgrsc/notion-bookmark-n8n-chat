"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Loader2, LogOut, MessageSquare, RefreshCw, ExternalLink, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  isError?: boolean
  originalInput?: string
}

interface ChatWidgetProps {
  isAuthenticated: boolean
  onAuthRequired: () => void
  onLogout: () => void
}

// 艺术字N组件
const ArtisticN = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <span
      className="text-white font-bold text-2xl relative z-10"
      style={{
        fontFamily: "Georgia, serif",
        textShadow: "0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.3)",
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
      }}
    >
      N
    </span>
  </div>
)

// 简单的代码高亮组件
const CodeBlock = ({
  children,
  language,
  isUserMessage,
  onCopy,
}: {
  children: string
  language?: string
  isUserMessage: boolean
  onCopy: (text: string) => void
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group/code my-3">
      {/* 语言标签和复制按钮 */}
      <div className="flex items-center justify-between mb-1">
        {language && (
          <span
            className={`text-xs px-2 py-1 rounded-t ${
              isUserMessage ? "bg-white/20 text-white/80" : "bg-gray-200 text-gray-600"
            }`}
          >
            {language}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 rounded-full opacity-0 group-hover/code:opacity-100 transition-opacity ${
            isUserMessage ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-600"
          }`}
          onClick={handleCopy}
          title="复制代码"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>

      {/* 代码内容 */}
      <pre
        className={`p-4 rounded-lg text-xs font-mono overflow-x-auto border ${
          isUserMessage ? "bg-black/20 text-white border-white/20" : "bg-gray-900 text-gray-100 border-gray-700"
        }`}
        style={{
          fontFamily: "JetBrains Mono, Consolas, Monaco, 'Courier New', monospace",
          lineHeight: "1.5",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <code>{children}</code>
      </pre>
    </div>
  )
}

export function ChatWidget({ isAuthenticated, onAuthRequired, onLogout }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "您好！我是您的书签管理助手，有什么可以帮助您的吗？",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [sessionId, setSessionId] = useState("")

  // 生成会话ID
  useEffect(() => {
    let storedSessionId = localStorage.getItem("chatSessionId")
    if (!storedSessionId) {
      storedSessionId = generateUUID()
      localStorage.setItem("chatSessionId", storedSessionId)
    }
    setSessionId(storedSessionId)
  }, [])

  // 生成UUID
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 复制文本到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedText(text)
        setTimeout(() => setCopiedText(null), 2000)
      },
      (err) => {
        console.error("无法复制文本: ", err)
      },
    )
  }

  const handleChatOpen = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      onAuthRequired()
      return
    }
    setIsOpen(true)
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !isAuthenticated) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageText = inputValue
    setInputValue("")
    setIsLoading(true)

    try {
      // 使用参考代码中的请求格式
      const requestBody = {
        sessionId: sessionId,
        action: "sendMessage",
        chatInput: messageText,
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": sessionId,
          Accept: "application/json",
          "Accept-Encoding": "identity",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(50000), // 50秒超时
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const data = await response.json()

      // 根据参考代码处理多种响应格式
      let botMessage = ""
      if (data.text) {
        botMessage = data.text
      } else if (data.message) {
        botMessage = data.message
      } else if (data.output) {
        botMessage = data.output
      } else if (data.response) {
        botMessage = data.response
      } else {
        botMessage = "收到响应，但无法解析消息内容。"
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: botMessage,
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "抱歉，发送消息时出现错误。请检查网络连接后重试。",
        isUser: false,
        timestamp: new Date(),
        isError: true,
        originalInput: messageText,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const retryMessage = async (originalInput: string, errorMessageId: string) => {
    // 设置重试状态
    setRetryingMessageId(errorMessageId)

    // 移除错误消息
    setMessages((prev) => prev.filter((msg) => msg.id !== errorMessageId))

    // 重新发送消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content: originalInput,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const requestBody = {
        sessionId: sessionId,
        action: "sendMessage",
        chatInput: originalInput,
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": sessionId,
          Accept: "application/json",
          "Accept-Encoding": "identity",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(50000),
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const data = await response.json()

      let botMessage = ""
      if (data.text) {
        botMessage = data.text
      } else if (data.message) {
        botMessage = data.message
      } else if (data.output) {
        botMessage = data.output
      } else if (data.response) {
        botMessage = data.response
      } else {
        botMessage = "收到响应，但无法解析消息内容。"
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: botMessage,
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
    } catch (error) {
      console.error("Error retrying message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "抱歉，重试时仍然出现错误。请检查网络连接后重试。",
        isUser: false,
        timestamp: new Date(),
        isError: true,
        originalInput: originalInput,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setRetryingMessageId(null)
    }
  }

  return (
    <>
      {/* 增强立体效果的悬浮聊天按钮 - 更明亮的颜色 */}
      {!isOpen && (
        <div
          className="fixed bottom-8 right-8 z-[9999] cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1"
          style={{ pointerEvents: "auto" }}
          onClick={handleChatOpen}
          role="button"
          tabIndex={0}
          aria-label="Open chat"
        >
          <div className="relative w-[48px] h-[48px] flex items-center justify-center">
            <span style={{ fontSize: "48px" }} className="z-10">🌲</span> {/*确保 emoji 在脉冲动画之上*/}
            {/* 增强的脉冲动画环 */}
            <div
              className="absolute inset-0 rounded-full animate-[ping_3s_ease-in-out_infinite]"
              style={{
                pointerEvents: "none",
                background: "radial-gradient(circle, rgba(74,222,128,0.4) 0%, rgba(52,211,153,0.2) 50%, transparent 70%)",
              }}
            ></div>
            <div
              className="absolute inset-2 rounded-full animate-[pulse_4s_ease-in-out_infinite]"
              style={{
                pointerEvents: "none",
                background: "radial-gradient(circle, rgba(74,222,128,0.3) 0%, rgba(52,211,153,0.1) 60%, transparent 80%)",
              }}
            ></div>
          </div>
        </div>
      )}

      {/* 聊天窗口 */}
      {isOpen && isAuthenticated && (
        <Card className="fixed bottom-8 right-8 w-96 h-[32rem] shadow-[0_20px_60px_-15px_rgba(34,197,94,0.2)] border-0 bg-white/95 backdrop-blur-md z-[9999] rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">书签助手</CardTitle>
                <p className="text-xs text-green-100">在线服务</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false) // 先关闭聊天窗口
                  onLogout() // 然后执行登出
                }}
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[calc(32rem-4rem)]">
            {/* 消息区域 */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                    <div className="flex flex-col max-w-[80%] min-w-[60px] w-fit group">
                      <div
                        className={`relative rounded-2xl px-4 py-3 text-sm shadow-sm w-fit max-w-full ${
                          message.isUser
                            ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                            : message.isError
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-gray-100 text-gray-900 border border-gray-200"
                        }`}
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          hyphens: "auto",
                          lineHeight: "1.5",
                          minWidth: "fit-content",
                          maxWidth: "100%",
                        }}
                      >
                        {/* 复制按钮 */}
                        {!message.isUser && !message.isError && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700"
                              onClick={() => copyToClipboard(message.content)}
                              title="复制消息"
                            >
                              {copiedText === message.content ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}

                        <div className="markdown-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                              // 段落处理
                              p: ({ children, ...props }) => {
                                // 如果段落只包含换行符，渲染为换行
                                if (typeof children === "string" && children.trim() === "") {
                                  return <br />
                                }
                                return (
                                  <p
                                    className="mb-2 last:mb-0 leading-relaxed"
                                    style={{ wordSpacing: "0.1em" }}
                                    {...props}
                                  >
                                    {children}
                                  </p>
                                )
                              },

                              // 换行处理
                              br: () => <br />,

                              // 链接处理
                              a: ({ href, children, ...props }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-0.5 ${
                                    message.isUser
                                      ? "text-white/90 hover:text-white underline decoration-white/50 hover:decoration-white"
                                      : "text-green-600 hover:text-green-700 underline decoration-green-400/50 hover:decoration-green-500"
                                  }`}
                                  {...props}
                                >
                                  {children}
                                  <ExternalLink className="h-3 w-3 inline-block" />
                                </a>
                              ),

                              // 代码处理
                              // @ts-ignore TODO: Investigate ReactMarkdown type issue with 'inline' prop
                              code: ({ node, inline, className, children, ...restProps }) => {
                                const match = /language-(\w+)/.exec(className || "");
                                const codeContent = String(children).replace(/\n$/, "");

                                return !inline && match ? (
                                  <CodeBlock
                                    language={match[1]}
                                    isUserMessage={message.isUser} // 恢复对外部 message 的正确引用
                                    onCopy={copyToClipboard}
                                  >
                                    {codeContent}
                                  </CodeBlock>
                                ) : (
                                  <code
                                    className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                      message.isUser ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800" // 恢复对外部 message 的正确引用
                                    }`}
                                    style={{ wordBreak: "break-all" }}
                                    {...(restProps as any)} // 保留 as any 以尝试解决原始 TS 错误
                                  >
                                    {children}
                                  </code>
                                )
                              },

                              // 预格式化文本
                              pre: ({ children }) => <>{children}</>,

                              // 文本样式
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,

                              // 标题
                              h1: ({ children }) => (
                                <h1 className="text-lg font-bold mt-3 mb-2 first:mt-0 border-b pb-1">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>
                              ),

                              // 列表
                              ul: ({ children }) => (
                                <ul className="list-disc pl-4 my-2 space-y-1 first:mt-0 last:mb-0">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-4 my-2 space-y-1 first:mt-0 last:mb-0">{children}</ol>
                              ),
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,

                              // 引用
                              blockquote: ({ children }) => (
                                <blockquote
                                  className={`border-l-4 pl-3 italic my-2 first:mt-0 last:mb-0 ${
                                    message.isUser ? "border-white/30 text-white/90" : "border-gray-300 text-gray-700"
                                  }`}
                                >
                                  {children}
                                </blockquote>
                              ),

                              // 分隔线
                              hr: () => (
                                <hr
                                  className={`my-3 border-t first:mt-0 last:mb-0 ${
                                    message.isUser ? "border-white/20" : "border-gray-200"
                                  }`}
                                />
                              ),

                              // 表格
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-2 first:mt-0 last:mb-0">
                                  <table className="min-w-full border-collapse border border-gray-300 text-xs">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead
                                  className={`${message.isUser ? "bg-white/20 text-white" : "bg-gray-100 text-gray-800"}`}
                                >
                                  {children}
                                </thead>
                              ),
                              tbody: ({ children }) => <tbody>{children}</tbody>,
                              tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
                              th: ({ children }) => (
                                <th className="border border-gray-300 px-2 py-1 font-semibold text-left">{children}</th>
                              ),
                              td: ({ children }) => <td className="border border-gray-300 px-2 py-1">{children}</td>,

                              // 图片
                              img: ({ src, alt }) => (
                                <img
                                  src={src || "/placeholder.svg"}
                                  alt={alt}
                                  className="max-w-full h-auto rounded my-2 border border-gray-200"
                                  loading="lazy"
                                />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* 错误消息的重试按钮 */}
                      {message.isError && message.originalInput && (
                        <div className="flex justify-start mt-2">
                          <Button
                            onClick={() => retryMessage(message.originalInput!, message.id)}
                            disabled={isLoading || retryingMessageId === message.id}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-full flex items-center gap-2 transition-all duration-200"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${retryingMessageId === message.id ? "animate-spin" : ""}`}
                            />
                            {retryingMessageId === message.id ? "重试中..." : "重试"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm border border-gray-200">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* 输入区域 */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的书签管理指令..."
                  disabled={isLoading}
                  className="flex-1 rounded-full border-gray-200 focus:border-green-400 focus:ring-green-400"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
