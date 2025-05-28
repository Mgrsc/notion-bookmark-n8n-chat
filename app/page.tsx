"use client"
import { useState, useEffect } from "react"
import { NotionEmbed } from "@/components/notion-embed"
import { ChatWidget } from "@/components/chat-widget"
import { AuthModal } from "@/components/auth-modal"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // 检查本地存储中的认证状态
    const authStatus = localStorage.getItem("chat-authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    setShowAuthModal(false)
    localStorage.setItem("chat-authenticated", "true")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("chat-authenticated")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-25 via-emerald-25 to-teal-50">
      {/* Notion 嵌入页面 - 悬浮式布局 */}
      <NotionEmbed />

      {/* n8n 聊天悬浮窗 */}
      <ChatWidget
        isAuthenticated={isAuthenticated}
        onAuthRequired={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* 认证模态框 */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={handleAuthSuccess} />
    </div>
  )
}
