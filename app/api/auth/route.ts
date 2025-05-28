import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "用户名和密码不能为空",
        },
        { status: 400 },
      )
    }

    // 从环境变量获取认证配置
    const validUsername = process.env.CHAT_AUTH_USERNAME
    const validPassword = process.env.CHAT_AUTH_PASSWORD

    // 如果没有配置环境变量，使用默认配置
    const authUsername = validUsername || "admin"
    const authPassword = validPassword || "admin123"

    // 验证用户凭据
    const isValid = username === authUsername && password === authPassword

    if (isValid) {
      console.log(`用户 ${username} 认证成功`)
      return NextResponse.json({
        success: true,
        message: "认证成功",
        user: username,
      })
    } else {
      console.log(`用户 ${username} 认证失败`)
      return NextResponse.json(
        {
          success: false,
          message: "用户名或密码错误",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("认证 API 错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: "服务器错误",
      },
      { status: 500 },
    )
  }
}
