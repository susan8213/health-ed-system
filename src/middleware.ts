export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // 保護所有 API 路由（除了 auth、health、link-preview）
    '/api/((?!auth|health$|link-preview$).*)',
    // 保護所有頁面（除了靜態資源和認證頁面）
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpeg$|.*\\.jpg$|.*\\.gif$|.*\\.svg$|auth).*)'
  ]
};