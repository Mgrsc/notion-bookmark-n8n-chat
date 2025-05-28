import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, action, chatInput } = await request.json()

    if (!chatInput || typeof chatInput !== "string") {
      return NextResponse.json({ success: false, error: "Invalid message format" }, { status: 400 })
    }

    // n8n webhook 配置
    const webhookUrl = process.env.N8N_CHAT_WEBHOOK_URL
    const username = process.env.N8N_CHAT_AUTH_USERNAME
    const password = process.env.N8N_CHAT_AUTH_PASSWORD

    if (!webhookUrl) {
      console.error("N8N_CHAT_WEBHOOK_URL is not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Webhook not configured",
          response: "聊天服务暂时不可用，请稍后再试。",
        },
        { status: 500 },
      )
    }

    // 准备请求头 - 按照参考代码格式
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Session-Id": sessionId || "default-session",
      Accept: "application/json",
      "Accept-Encoding": "identity",
      "User-Agent": "Vercel-Chat-Widget/1.0",
    }

    // 如果配置了基本认证，添加认证头
    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString("base64")
      headers["Authorization"] = `Basic ${credentials}`
    }

    // 按照参考代码的请求体格式发送到 n8n webhook
    const requestBody = {
      sessionId: sessionId || "default-session",
      action: action || "sendMessage",
      chatInput: chatInput.trim(),
    }

    // 调试日志
    if (process.env.DEBUG_MODE === "true") {
      console.log("发送到 n8n 的请求:", {
        url: webhookUrl,
        headers: { ...headers, Authorization: headers.Authorization ? "[HIDDEN]" : undefined },
        body: requestBody,
      })
    }

    // 固定 50 秒超时时间
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(50000), // 固定 50 秒超时
    })

    if (!response.ok) {
      console.error(`n8n webhook error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        {
          success: false,
          error: `Webhook error: ${response.status}`,
          response: "抱歉，AI 助手暂时无法回复。请稍后再试。",
        },
        { status: 500 },
      )
    }

    let data
    try {
      const responseText = await response.text()

      if (process.env.DEBUG_MODE === "true") {
        console.log("n8n 原始响应:", responseText.substring(0, 200) + "...")
      }

      // 尝试直接解析 JSON
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        // 如果直接解析失败，尝试从第一个 { 开始解析
        const firstBraceIndex = responseText.indexOf("{")
        if (firstBraceIndex !== -1) {
          const potentialJson = responseText.substring(firstBraceIndex)
          data = JSON.parse(potentialJson)
        } else {
          throw new Error("Could not find valid JSON in response")
        }
      }
    } catch (parseError) {
      console.error("Failed to parse n8n response:", parseError)
      return NextResponse.json({
        success: true,
        response: "收到您的消息，正在处理中...",
      })
    }

    // 按照参考代码处理多种响应格式
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
      botMessage = "收到您的消息，正在处理中..."
    }

    if (process.env.DEBUG_MODE === "true") {
      console.log("处理后的响应:", { botMessage, originalData: data })
    }

    return NextResponse.json({
      success: true,
      text: botMessage,
      message: botMessage,
      response: botMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        processed: true,
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        response: "抱歉，服务出现错误。请稍后再试。",
      },
      { status: 500 },
    )
  }
}
