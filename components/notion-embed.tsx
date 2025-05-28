"use client"

export function NotionEmbed() {
  const notionUrl = process.env.NEXT_PUBLIC_NOTION_EMBED_URL

  if (!notionUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Notion 页面加载中...</h2>
            <p className="text-gray-500">请确保 NEXT_PUBLIC_NOTION_EMBED_URL 环境变量已正确配置</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-12 flex items-center justify-center">
      <div className="w-full max-w-6xl h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-[0_25px_80px_-15px_rgba(34,197,94,0.25),0_0_20px_-5px_rgba(0,0,0,0.1)] overflow-hidden border border-green-100/50 backdrop-blur-sm transform hover:shadow-[0_30px_100px_-15px_rgba(34,197,94,0.3),0_0_30px_-5px_rgba(0,0,0,0.15)] transition-all duration-500">
        <iframe
          src={notionUrl}
          className="w-full h-full border-0"
          title="Notion Bookmark Database"
          loading="lazy"
          allow="fullscreen"
        />
      </div>
    </div>
  )
}
