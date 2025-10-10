# Technical Learning Guide - TCM Clinic Management System

This document provides a comprehensive technical learning guide using the TCM Clinic Management System as a practical example to understand modern web development concepts. Each section combines theoretical explanations with real-world implementations from our project, helping developers understand not just "how" but "why" we make certain technical decisions.

## Why This Guide Matters

Modern web development involves numerous interconnected technologies that work together to create robust, scalable applications. Rather than learning each technology in isolation, this guide demonstrates how they integrate in a real production system. You'll see how Next.js handles both server and client-side rendering, how authentication flows through the entire application, how databases are optimized for specific use cases, and how external APIs are reliably integrated.

The TCM clinic system serves as an excellent learning example because it encompasses common real-world challenges: user authentication, data management, external API integration, responsive design, and performance optimization. These are the same challenges you'll face in most modern web applications.

## Table of Contents
1. [Next.js Fundamentals](#nextjs-fundamentals)
2. [NextAuth.js Authentication](#nextauth-authentication)
3. [CSS Modules](#css-modules)
4. [MongoDB Integration](#mongodb-integration)
   - [CRUD Operations](#crud-operations)
   - [Aggregation Pipeline](#aggregation-pipeline)
   - [MongoDB vs ORM Comparison](#mongodb-vs-orm-comparison)
5. [LINE API Client](#line-api-client)
6. [Project Architecture](#project-architecture)
7. [Best Practices](#best-practices)

---

## Next.js Fundamentals

Next.js is a React framework that provides the foundation for modern web applications. It solves many common challenges developers face when building React applications: routing, performance optimization, SEO, and full-stack development capabilities. Understanding Next.js deeply is crucial because it shapes how we structure our entire application.

### The Evolution from Pages Router to App Router

Before diving into our implementation, it's important to understand why we chose the App Router over the legacy Pages Router. The App Router, introduced in Next.js 13 and stabilized in Next.js 14, represents a fundamental shift in how Next.js applications are structured. It provides better developer experience, improved performance, and more intuitive file-based routing.

**Key advantages of App Router:**
- **Colocation**: Related files (components, styles, tests) can live together
- **Layouts**: Shared UI components that persist across route changes
- **Server Components by default**: Better performance and SEO
- **Streaming**: Progressive page loading for better user experience
- **Parallel routes**: Multiple pages can render simultaneously

### 1. App Router Architecture (Next.js 14)

The App Router uses a file-system based routing where folders define routes and special files define UI for route segments. This approach makes the application structure immediately understandable and maintainable.

#### Understanding the File Structure

Each file in the `app` directory has a specific purpose. Let's break down what each file type does and why it's important:

#### File Structure
```
src/app/
├── layout.tsx          # Root layout (Server Component) - Wraps entire app
├── page.tsx           # Home page (Server Component) - Default route content
├── globals.css        # Global styles applied to entire application
├── api/               # API routes - Backend endpoints
│   ├── auth/          # NextAuth endpoints - Authentication flow
│   ├── users/         # Patient management API - CRUD operations
│   └── notifications/ # LINE messaging API - External service integration
├── edit/[id]/
│   └── page.tsx       # Dynamic route for editing - [id] is a parameter
└── patient/[id]/
    └── records/
        └── page.tsx   # Nested dynamic route - Multiple URL segments
```

**Special Files in App Router:**
- `layout.tsx`: Defines shared UI that wraps multiple pages. Layouts persist during navigation and don't re-render.
- `page.tsx`: Makes a route segment publicly accessible. This is what users see when they visit a URL.
- `loading.tsx`: Creates instant loading states for route segments using React Suspense.
- `error.tsx`: Handles runtime errors and provides fallback UI.
- `not-found.tsx`: Shows custom 404 pages for missing routes.

**Why this structure matters:**
- **Predictability**: Developers immediately know where to find specific functionality
- **Scalability**: Adding new routes doesn't require configuration changes
- **Performance**: Next.js can optimize loading and bundling based on the structure
- **SEO**: Each route can have its own metadata and optimization

#### Example: Root Layout (Server Component)

The root layout is the foundation of your application. It wraps every page and defines the basic HTML structure. Understanding this component is crucial because it affects every single page in your application.

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/server'
import Navbar from '@/components/Navbar'
import './globals.css'

// Font optimization - Next.js automatically optimizes font loading
const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

**Key concepts in this layout:**

1. **Font Optimization**: Next.js automatically downloads and self-hosts Google Fonts, eliminating external network requests for better performance and privacy.

2. **Server Component by Default**: This layout runs on the server, meaning the HTML is generated server-side. This improves initial page load and SEO.

3. **Children Prop**: The `children` prop represents the content of each page. When users navigate between routes, only the children change while the layout persists.

4. **Global Styles**: Imported CSS applies to the entire application. This is where you'd define CSS variables, reset styles, and base typography.

**Why Server Components matter:**
- **Performance**: JavaScript bundle size is smaller because server components don't ship to the client
- **Security**: Server-only code (like database queries) never reaches the browser
- **SEO**: Search engines can immediately see the rendered HTML
- **Initial Load**: Faster first contentful paint because HTML is pre-rendered

### 2. Server-Side Rendering (SSR)

Server-Side Rendering is one of Next.js's most powerful features. Instead of sending an empty HTML shell and building the page with JavaScript (like traditional SPAs), SSR generates the complete HTML on the server before sending it to the browser. This approach provides immediate content visibility and better SEO.

#### When to Use SSR

SSR is ideal for:
- **Content-heavy pages** that need to be indexed by search engines
- **Dynamic data** that changes frequently but doesn't require real-time updates
- **Initial page loads** where you want users to see content immediately
- **Mobile users** on slower networks who benefit from pre-rendered HTML

In our TCM system, patient records are perfect for SSR because they're relatively static once created and benefit from fast initial loading.

#### Example: Patient Records Page with SSR

This example demonstrates how to fetch data on the server and render it as complete HTML before sending to the client:

```typescript
// src/app/patient/[id]/records/page.tsx
import { getPatientRecords } from '@/lib/mongodb'
import { notFound } from 'next/navigation'

// This is a Server Component - runs on the server before sending HTML to client
export default async function PatientRecordsPage({
  params
}: {
  params: { id: string }
}) {
  // Data fetching happens on the server - never blocks client rendering
  const records = await getPatientRecords(params.id)
  
  if (!records) {
    notFound() // Built-in 404 handling - returns proper HTTP status
  }

  // HTML is fully rendered on server with actual data
  return (
    <div>
      <h1>Patient Records</h1>
      {records.map(record => (
        <div key={record._id}>
          <p>Visit Date: {record.visitDate}</p>
          <p>Symptoms: {record.symptoms.join(', ')}</p>
        </div>
      ))}
    </div>
  )
}

// Generate metadata on the server - improves SEO and social sharing
export async function generateMetadata({
  params
}: {
  params: { id: string }
}) {
  const patient = await getPatient(params.id)
  return {
    title: `${patient.name} - Medical Records`,
    description: `Medical records for ${patient.name}`,
    openGraph: {
      title: `${patient.name} - Medical Records`,
      description: `Viewing medical history for patient ${patient.name}`,
    }
  }
}
```

**Deep dive into this SSR implementation:**

1. **Async Server Components**: The `async` keyword allows us to await data directly in the component. This is only possible in Server Components.

2. **Direct Database Access**: We can directly call database functions without creating API endpoints. This reduces the number of network requests and improves performance.

3. **Built-in Error Handling**: The `notFound()` function provides proper HTTP status codes and can be caught by error boundaries.

4. **Metadata Generation**: The `generateMetadata` function runs on the server and creates dynamic meta tags for each page, crucial for SEO and social media sharing.

**Performance implications:**
- **First Contentful Paint**: Users see content immediately without waiting for JavaScript to load
- **SEO Benefits**: Search engines can crawl and index the complete content
- **Reduced JavaScript**: Less code shipped to the client means faster loading
- **Caching**: Server-rendered pages can be cached at the CDN level

**Benefits of SSR in our project:**
- **SEO-friendly patient record pages**: Search engines can index patient data for internal clinic searches
- **Fast initial page load**: Medical staff see patient information immediately, crucial in clinical settings
- **Server-side data validation**: Patient data is validated on the server before rendering, ensuring data integrity
- **Secure database access**: Database credentials and business logic never reach the client browser

### 3. Client-Side Rendering (CSR)

While SSR is excellent for initial page loads and SEO, many parts of modern web applications need to be interactive and respond to user actions in real-time. This is where Client-Side Rendering comes in. CSR allows for dynamic user interfaces that update without full page refreshes.

#### When to Use CSR

Client-Side Rendering is essential for:
- **Interactive forms** with real-time validation
- **Search interfaces** that update results as users type
- **Dynamic UI updates** like modals, notifications, and live data
- **State management** that persists across user interactions
- **Real-time features** like chat or live updates

#### Understanding the 'use client' Directive

In Next.js App Router, components are Server Components by default. To make a component interactive, you must explicitly mark it as a Client Component using the `'use client'` directive at the top of the file.

#### Example: Interactive Search Component

This search component demonstrates how CSR enables rich, interactive user experiences:

```typescript
// src/components/SearchForm.tsx
'use client' // This directive makes it a Client Component

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchForm() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const router = useRouter()

  // Client-side event handling with debouncing for better UX
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Client-side API call - happens after page is loaded
      const response = await fetch(`/api/users?keyword=${encodeURIComponent(keyword)}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      setResults(data.patients)
      
      // Client-side navigation - updates URL without full page reload
      router.push(`/?search=${encodeURIComponent(keyword)}`)
    } catch (error) {
      console.error('Search error:', error)
      // Handle errors gracefully in the UI
    } finally {
      setLoading(false)
    }
  }, [keyword, router])

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search patients..."
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map(patient => (
            <div key={patient._id}>
              {patient.name}
            </div>
          ))}
        </div>
      )}
    </form>
  )
}
```

**Detailed explanation of CSR concepts:**

1. **State Management**: `useState` hooks manage component state that changes over time. This state is local to the component and persists during user interactions.

2. **Event Handling**: Form submission and input changes are handled entirely on the client, providing immediate feedback to users.

3. **API Communication**: The component fetches data from our API routes, which act as a bridge between the client and our database.

4. **Loading States**: Users see immediate feedback when operations are in progress, improving perceived performance.

5. **Error Handling**: Client-side error handling ensures users aren't left wondering what went wrong.

6. **Navigation**: Client-side routing updates the URL and browser history without full page reloads.

**When to use CSR in our project:**
- **Interactive search functionality**: Real-time search results as users type patient names
- **Real-time form validation**: Immediate feedback on form inputs without server roundtrips
- **Dynamic UI updates**: Notifications, modals, and status messages that appear based on user actions
- **Client-side state management**: Shopping cart-like functionality for selecting multiple patients for messaging

### 4. API Routes

API Routes in Next.js provide a way to build backend functionality directly within your Next.js application. They're essentially serverless functions that handle HTTP requests and responses. This eliminates the need for a separate backend server while providing full backend capabilities.

#### Understanding Next.js API Routes

API Routes bridge the gap between your frontend and backend functionality. They can:
- Handle database operations
- Integrate with external services
- Implement authentication and authorization
- Process file uploads
- Send emails or notifications

The beauty of API Routes is that they're deployed alongside your frontend, reducing complexity and latency.

#### Example: Patient Search API

This API route demonstrates how to handle database queries, authentication, and error handling in a production-ready way:

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Authentication check - ensures only logged-in users can access patient data
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extract and validate query parameters
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword') || ''
  
  try {
    const db = await getDatabase()
    
    // Multi-keyword OR search logic - handles complex search patterns
    // Example: "王 小明" finds patients with either "王" OR "小明" in their name
    const keywords = keyword.trim().split(/\s+/)
    const query = keywords.length > 0 ? {
      $or: keywords.map(kw => ({
        name: { $regex: kw, $options: 'i' }
      }))
    } : {}

    // Optimized database query with proper indexing
    const patients = await db.collection('patients')
      .find(query)
      .sort({ updatedAt: -1 })  // Most recently updated first
      .limit(50)                // Prevent overwhelming the UI
      .toArray()

    return NextResponse.json({ patients })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

**Breaking down this API implementation:**

1. **Request Handling**: The function signature `GET(request: NextRequest)` tells Next.js this handles GET requests to this endpoint.

2. **Authentication Middleware**: Before processing any request, we verify the user is authenticated. This is crucial for medical data protection.

3. **Input Validation**: We extract and sanitize query parameters to prevent injection attacks and ensure data integrity.

4. **Business Logic**: The search algorithm supports multiple keywords with OR logic, making the search user-friendly.

5. **Database Optimization**: The query uses indexes and limits results to maintain performance even with large datasets.

6. **Error Handling**: Comprehensive error handling ensures the API always returns appropriate HTTP status codes and error messages.

7. **Security**: No sensitive database connection details are exposed to the client.

#### Dynamic API Routes

Dynamic API routes allow you to handle different resources with parameterized URLs. This is essential for REST API design where you need to operate on specific resources.

```typescript
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const patientId = params.id
  // Handle individual patient lookup
  // Example URL: /api/users/507f1f77bcf86cd799439011
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const patientId = params.id
  const body = await request.json()
  // Handle patient updates
  // This would be called when updating patient information
}
```

**Dynamic routing benefits:**
- **RESTful API design**: Clean URLs that follow REST conventions
- **Resource-specific operations**: Different endpoints for different data operations
- **Parameter validation**: Built-in parameter extraction and type safety
- **Scalable architecture**: Easy to add new resource types without route conflicts

**Why API Routes matter in our system:**
- **Unified deployment**: Backend and frontend deploy together, reducing operational complexity
- **Type safety**: TypeScript types are shared between frontend and backend
- **Performance**: No network latency between frontend and backend since they're the same deployment
- **Security**: Database credentials and business logic stay server-side
- **Scalability**: Automatically scales with Vercel's serverless infrastructure

---

## NextAuth.js Authentication

Authentication is one of the most critical aspects of any web application, especially in healthcare where data security is paramount. NextAuth.js provides a robust, secure, and developer-friendly authentication solution that handles complex OAuth flows, session management, and security best practices out of the box.

### Why NextAuth.js?

Building authentication from scratch is complex and error-prone. You need to handle:
- OAuth flows with external providers
- Secure session management
- CSRF protection
- JWT token handling
- Database session storage
- Password hashing and validation
- Account linking and user management

NextAuth.js solves all these challenges while maintaining flexibility and security. It's particularly well-suited for our medical application because it provides enterprise-grade security features that comply with healthcare data protection requirements.

### Understanding OAuth Flow

OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts. In our case, we use Google OAuth, which means:

1. **User clicks "Sign in with Google"**
2. **Redirect to Google**: User is redirected to Google's authorization server
3. **User authorizes**: User logs in with Google and grants permissions
4. **Authorization code**: Google redirects back with an authorization code
5. **Token exchange**: NextAuth exchanges the code for access tokens
6. **User creation**: NextAuth creates or updates the user in our system
7. **Session creation**: A secure session is established

This flow ensures we never handle user passwords directly, and Google manages the security of user credentials.

### 1. NextAuth Configuration

The configuration file is the heart of your authentication system. It defines how authentication works, which providers to use, and how to customize the authentication flow.

#### Setup Auth Configuration

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Define what information we want from Google
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent', // Always show consent screen for security
        }
      }
    })
  ],
  callbacks: {
    // Customize the session object that's returned to client components
    async session({ session, token }) {
      if (session?.user) {
        // Add custom fields to session
        session.user.id = token.sub!
        session.user.role = token.role as string || 'user'
      }
      return session
    },
    
    // Customize the JWT token (server-side only)
    async jwt({ user, token, account }) {
      // Initial sign in
      if (user) {
        token.uid = user.id
        // You could fetch user role from database here
        token.role = await getUserRole(user.email)
      }
      return token
    },
    
    // Control who can sign in
    async signIn({ user, account, profile }) {
      // Example: Only allow specific email domains
      if (user.email?.endsWith('@clinic.com')) {
        return true
      }
      return false // Reject sign in
    }
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error',   // Custom error page
    signOut: '/auth/signout' // Custom sign-out page
  },
  session: {
    strategy: 'jwt', // Use JWT instead of database sessions for better performance
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Security options
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET, // Required for JWT encryption
}
```

**Deep dive into configuration options:**

1. **Providers**: Define how users can authenticate. Google Provider handles the OAuth flow automatically.

2. **Callbacks**: Powerful functions that let you customize the authentication flow:
   - `session`: Runs when session is accessed, perfect for adding custom user data
   - `jwt`: Runs when JWT is created/updated, ideal for adding server-side data
   - `signIn`: Controls access - you can implement custom authorization logic here

3. **Pages**: Custom pages give you full control over the user experience and branding.

4. **Session Strategy**: JWT vs Database sessions:
   - **JWT**: Faster, stateless, works well with serverless
   - **Database**: More secure, supports server-side session revocation

5. **Security**: NextAuth.js includes CSRF protection, secure cookies, and XSS prevention by default.

#### NextAuth API Route

The API route handler is what makes NextAuth work. It handles all authentication endpoints automatically:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

// Export the same handler for both GET and POST requests
// This handles all OAuth flows, token refresh, and session management
export { handler as GET, handler as POST }
```

**What this single route handles:**
- `/api/auth/signin` - Sign in page and form submission
- `/api/auth/signout` - Sign out functionality
- `/api/auth/callback/google` - OAuth callback from Google
- `/api/auth/session` - Current session information
- `/api/auth/csrf` - CSRF token for security
- `/api/auth/providers` - Available authentication providers

This catch-all route (`[...nextauth]`) handles all authentication-related URLs automatically, so you don't need to implement OAuth flows manually.

### 2. Server-Side Authentication

Server-side authentication is crucial for protecting sensitive data and ensuring only authorized users can access patient information. NextAuth.js provides two main approaches for protecting routes: middleware-based protection and manual session checks in individual routes.

#### Approach 1: Middleware-Based Protection (Recommended)

Instead of manually checking authentication in every API route and page, we can use Next.js middleware to automatically protect routes. This approach is more maintainable and ensures consistent protection across the application.

```typescript
// src/middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // Protect all API routes except auth, health check, and link preview
    '/api/((?!auth|health$|link-preview$).*)',
    // Protect all pages except static assets and auth pages
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpeg$|.*\\.jpg$|.*\\.gif$|.*\\.svg$|auth).*)'
  ]
};
```

**Middleware configuration breakdown:**

1. **Export NextAuth Middleware**: `export { default } from "next-auth/middleware"` uses NextAuth's built-in middleware
2. **Route Matching**: The `matcher` array defines which routes should be protected
3. **API Protection**: Protects all `/api/*` routes except authentication, health checks, and link preview endpoints
4. **Page Protection**: Protects all pages except static assets, Next.js internals, and authentication pages
5. **Regex Patterns**: Uses negative lookahead regex to exclude specific routes from protection

**Benefits of middleware approach:**
- **Centralized Protection**: All route protection logic is in one place
- **Automatic Redirect**: Unauthenticated users are automatically redirected to sign-in
- **Performance**: Runs at the edge before reaching your application code
- **Consistency**: Ensures no routes are accidentally left unprotected
- **Maintainability**: No need to add authentication checks to every API route

#### Approach 2: Manual Session Checks (For Specific Use Cases)

For more granular control or specific use cases, you can still manually check authentication in individual routes:

```typescript
// src/app/api/users/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Manual authentication check - only use when middleware isn't sufficient
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' }, 
      { status: 401 }
    )
  }

  // Optional: Check user permissions for specific endpoints
  if (session.user.role !== 'admin' && session.user.role !== 'staff') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // Proceed with authenticated logic
  const userId = session.user?.id
  console.log(`Authenticated request from user: ${userId}`)
  
  // Now safe to access patient data
  const patients = await getPatients()
  return NextResponse.json({ patients })
}
```

**When to use manual checks:**
- **Role-based permissions**: Different access levels for different user types
- **Resource-specific access**: Users can only access their own data
- **Custom business logic**: Complex authorization rules that middleware can't handle
- **Gradual migration**: When moving from manual checks to middleware protection

**Why server-side authentication matters:**

1. **Security**: Client-side checks can be bypassed, but server-side checks cannot
2. **Data Protection**: Ensures patient data is never accessible without proper authentication
3. **Audit Trails**: Server logs can track who accessed what data and when
4. **Compliance**: Meets healthcare data protection requirements (HIPAA, etc.)
5. **Performance**: Authentication checks happen before expensive database queries

#### Protecting Server Components

Server Components can also be protected with authentication checks. This is useful for pages that should only be accessible to logged-in users:

```typescript
// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Server-side authentication check
  const session = await getServerSession(authOptions)
  
  if (!session) {
    // Redirect to sign-in page if not authenticated
    redirect('/api/auth/signin')
  }

  // This code only runs for authenticated users
  const userPatients = await getPatientsForUser(session.user.id)

  return (
    <div>
      <h1>Welcome, {session.user?.name}</h1>
      <p>You have access to {userPatients.length} patients</p>
      {/* Protected content */}
    </div>
  )
}
```

**Benefits of server-side protection:**
- **Immediate redirect**: Unauthenticated users are redirected before the page renders
- **SEO protection**: Search engines won't index protected content
- **No flash of content**: Users never see protected content before being redirected
- **Server-side data**: Can fetch user-specific data immediately upon authentication verification

### 3. Client-Side Authentication

While server-side authentication protects data, client-side authentication enhances user experience by providing immediate feedback and enabling interactive authentication flows.

#### Using Session in Client Components

Client components can react to authentication state changes and provide interactive authentication UI:

```typescript
// src/components/UserProfile.tsx
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function UserProfile() {
  const { data: session, status } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Handle loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full"></div>
        <span>Loading...</span>
      </div>
    )
  }

  // Show sign-in button for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <div className="auth-section">
        <h2>Welcome to TCM Clinic System</h2>
        <p>Please sign in to access patient records</p>
        <button 
          onClick={() => signIn('google')}
          className="btn btn-primary"
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  // Show user info and sign-out for authenticated users
  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        {session?.user?.image && (
          <img 
            src={session.user.image} 
            alt="Profile" 
            className="profile-image"
          />
        )}
        <div>
          <p className="user-name">Signed in as {session?.user?.name}</p>
          <p className="user-email">{session?.user?.email}</p>
        </div>
      </div>
      
      <button 
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="btn btn-secondary"
      >
        {isSigningOut ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  )
}
```

**Key concepts in client-side authentication:**

1. **Session Hook**: `useSession()` provides real-time authentication state
2. **Status Handling**: Three states - loading, authenticated, unauthenticated
3. **Interactive Sign-in**: `signIn()` can specify providers and redirect URLs
4. **Graceful Sign-out**: `signOut()` properly clears sessions and redirects users
5. **Loading States**: Proper loading indicators improve user experience
6. **Error Handling**: Graceful handling of authentication errors

### 4. Custom Sign-In Pages

While NextAuth.js provides default authentication pages, creating custom sign-in pages gives you complete control over the user experience and branding. This is especially important for medical applications where trust and professionalism are crucial.

#### Creating a Custom Sign-In Page

```typescript
// src/app/auth/signin/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import SignInForm from '@/components/auth/SignInForm'

export default async function SignInPage() {
  // Redirect if already authenticated
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            TCM Clinic System
          </h1>
          <p className="mt-2 text-gray-600">
            Please sign in to access patient records
          </p>
        </div>
        
        <SignInForm />
        
        <div className="text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
            This system is for authorized healthcare providers only.
          </p>
        </div>
      </div>
    </div>
  )
}
```

#### Custom Sign-In Form Component

```typescript
// src/components/auth/SignInForm.tsx
'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SignInForm() {
  const [providers, setProviders] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleSignIn = async (providerId: string) => {
    setLoading(true)
    try {
      await signIn(providerId, { 
        callbackUrl: '/',
        redirect: true 
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
    }
  }

  // Display authentication errors
  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid credentials. Please try again.'
      case 'EmailSignin':
        return 'Unable to send email. Please try again.'
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
        return 'Error with authentication provider. Please try again.'
      case 'Callback':
        return 'Error in authentication callback. Please try again.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return 'An error occurred during authentication. Please try again.'
    }
  }

  if (!providers) {
    return <div className="text-center">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {getErrorMessage(error)}
        </div>
      )}

      {Object.values(providers).map((provider: any) => (
        <button
          key={provider.name}
          onClick={() => handleSignIn(provider.id)}
          disabled={loading}
          className={`
            w-full flex justify-center items-center px-4 py-3 border rounded-lg
            font-medium transition-colors duration-200
            ${provider.id === 'google' 
              ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' 
              : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
          `}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Signing in...
            </div>
          ) : (
            <>
              {provider.id === 'google' && (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Sign in with {provider.name}
            </>
          )}
        </button>
      ))}
    </div>
  )
}
```

#### Configuring Custom Pages in NextAuth

To use your custom sign-in page, update your NextAuth configuration:

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ... other configuration
  pages: {
    signIn: '/auth/signin',  // Custom sign-in page
    error: '/auth/error',    // Custom error page  
    signOut: '/auth/signout' // Custom sign-out page (optional)
  },
  // ... rest of configuration
}
```

**Benefits of custom authentication pages:**

1. **Brand Consistency**: Match your application's design and branding
2. **User Experience**: Provide context-specific messaging and guidance
3. **Error Handling**: Custom error messages that make sense to your users
4. **Compliance**: Include necessary legal text and healthcare disclaimers
5. **Analytics**: Track authentication events with your preferred analytics tools
6. **Accessibility**: Ensure authentication flow meets accessibility standards

**Key implementation considerations:**

- **Server-Side Redirect**: Check authentication status server-side to avoid flashing content
- **Error Handling**: Provide clear, actionable error messages for different failure scenarios
- **Loading States**: Show appropriate feedback during authentication process
- **Responsive Design**: Ensure the sign-in experience works well on all devices
- **Security**: Never expose sensitive authentication details in error messages

#### Session Provider Setup

The Session Provider is crucial for making authentication state available throughout your React component tree. It uses React Context to share session data without prop drilling.

```typescript
// src/app/layout.tsx
import { SessionProvider } from '@/components/SessionProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

```typescript
// src/components/SessionProvider.tsx
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}
```

**Why we need a custom SessionProvider wrapper:**

1. **Client Component Boundary**: The NextAuth SessionProvider is a client component, so we need a wrapper to use it in our server component layout
2. **Type Safety**: We can add custom TypeScript types for our specific session structure
3. **Configuration**: We can add session provider configuration (like refresh intervals) in one place
4. **Testing**: Easier to mock in tests when wrapped in our own component

**Session management benefits:**
- **Global State**: Authentication state is available in any component without prop drilling
- **Automatic Updates**: Session automatically updates across all components when auth state changes
- **Performance**: Only re-renders components that actually use session data
- **Persistent Sessions**: Users stay logged in across browser refreshes and tabs

---

## CSS Modules

CSS Modules solve one of the biggest challenges in web development: styling conflicts and maintainability. Traditional CSS suffers from global scope pollution, where styles can accidentally affect unintended elements. CSS Modules provide locally scoped CSS, eliminating these conflicts while maintaining the simplicity of CSS.

### Why CSS Modules?

**Problems with traditional CSS:**
- **Global scope**: All CSS classes are global, leading to naming conflicts
- **Specificity wars**: Developers use increasingly specific selectors to override styles
- **Dead code**: Hard to know if CSS rules are still being used
- **Coupling**: CSS is often tightly coupled to HTML structure

**CSS Modules solutions:**
- **Local scope**: Class names are scoped to the component by default
- **Automatic naming**: Unique class names are generated automatically
- **Explicit dependencies**: CSS imports make dependencies clear
- **Component coexistence**: Components can have similar class names without conflicts

### How CSS Modules Work

When you import a CSS Module, Next.js automatically:
1. **Processes the CSS file** and generates unique class names
2. **Returns a JavaScript object** mapping your class names to the generated ones
3. **Bundles the CSS** with automatic vendor prefixing and optimization
4. **Ensures uniqueness** by adding hashes to class names

### 1. Component-Scoped Styling

CSS Modules excel at component-level styling where each component owns its styles completely.

#### Example: UserCard Component

This example shows how CSS Modules enable complex, maintainable component styling:
```typescript
// src/components/UserCard.tsx
import styles from './UserCard.module.css'

interface UserCardProps {
  patient: Patient
  isSelected: boolean
  onSelect: (id: string) => void
}

export default function UserCard({ patient, isSelected, onSelect }: UserCardProps) {
  return (
    <div className={`${styles.card} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.name}>{patient.name}</h3>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(patient._id)}
          className={styles.checkbox}
        />
      </div>
      <div className={styles.content}>
        {patient.lineUserId && (
          <span className={styles.badge}>Has LINE Account</span>
        )}
        <p className={styles.recordCount}>
          {patient.historyRecords.length} records
        </p>
      </div>
    </div>
  )
}
```

**Key TypeScript and CSS Module concepts:**

1. **Import Statement**: `import styles from './UserCard.module.css'` imports the CSS Module as a JavaScript object
2. **Type Safety**: TypeScript can provide autocompletion for CSS class names when configured properly
3. **Conditional Classes**: String template literals allow dynamic class assignment based on component state
4. **Scoped Names**: `styles.card` refers to the locally scoped class name, preventing conflicts with other components

#### CSS Module File

```css
/* src/components/UserCard.module.css */

/* Base card styling with modern design principles */
.card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Hover states improve user experience */
.card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
  transform: translateY(-1px); /* Subtle lift effect */
}

/* Selected state clearly indicates user choice */
.selected {
  border-color: #007bff;
  background-color: #f8f9ff;
  box-shadow: 0 2px 12px rgba(0, 123, 255, 0.15);
}

/* Flexbox for consistent layout */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* Typography hierarchy */
.name {
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

/* Accessible form controls */
.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007bff; /* Modern checkbox styling */
}

/* Content layout */
.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Status indicators */
.badge {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Secondary information */
.recordCount {
  color: #666;
  font-size: 0.9em;
  margin: 0;
  font-style: italic;
}

/* Responsive design for mobile devices */
@media (max-width: 768px) {
  .card {
    padding: 12px;
    margin-bottom: 8px;
  }
  
  .header {
    margin-bottom: 8px;
  }
  
  .name {
    font-size: 1em;
  }
  
  .content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .badge {
    font-size: 0.75em;
  }
}

/* High contrast mode support for accessibility */
@media (prefers-contrast: high) {
  .card {
    border-width: 2px;
  }
  
  .selected {
    border-width: 3px;
  }
}

/* Reduced motion for users who prefer less animation */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  
  .card:hover {
    transform: none;
  }
}
```

**Deep dive into CSS Module benefits:**

1. **Scoped Styles**: Each class name is automatically scoped to this component, so `.card` won't conflict with other components' `.card` classes

2. **Performance**: CSS Modules are processed at build time, resulting in optimized CSS bundles with unused styles removed

3. **Maintainability**: Styles are colocated with components, making it easy to find and modify related code

4. **Predictability**: You can confidently modify styles knowing they won't affect other parts of the application

5. **Modern CSS Features**: Full support for CSS Grid, Flexbox, custom properties, and modern browser features

### 2. Dynamic Class Names

One of the most powerful features of CSS Modules is the ability to dynamically apply styles based on component state or props. This enables rich, interactive user interfaces that respond to user actions.

#### Advanced Conditional Styling

```typescript
// src/components/NotificationModal.tsx
import styles from './NotificationModal.module.css'
import { useState, useEffect } from 'react'

interface NotificationModalProps {
  isOpen: boolean
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onClose: () => void
}

export default function NotificationModal({ 
  isOpen, 
  type, 
  title, 
  message, 
  onClose 
}: NotificationModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Auto-close success messages after 3 seconds
      if (type === 'success') {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
      }
    } else {
      setIsAnimating(false)
    }
  }, [isOpen, type, onClose])

  // Build dynamic class names based on multiple conditions
  const overlayClasses = [
    styles.overlay,
    isOpen ? styles.visible : styles.hidden,
    isAnimating ? styles.animating : ''
  ].filter(Boolean).join(' ')

  const modalClasses = [
    styles.modal,
    styles[type], // Dynamic type-based styling
    isAnimating ? styles.slideIn : styles.slideOut
  ].filter(Boolean).join(' ')

  return (
    <div className={overlayClasses} onClick={onClose}>
      <div 
        className={modalClasses}
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking modal content
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>
          <p>{message}</p>
        </div>
      </div>
    </div>
  )
}
```

```css
/* NotificationModal.module.css */

/* Overlay covers entire screen */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: opacity 0.3s ease;
}

/* Visibility states */
.visible {
  opacity: 1;
  pointer-events: all;
}

.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Base modal styling */
.modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

/* Animation states */
.slideIn {
  transform: scale(1);
}

.slideOut {
  transform: scale(0.9);
}

/* Type-based styling - each notification type has distinct visual identity */
.success {
  border-left: 6px solid #28a745;
}

.success .header {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.error {
  border-left: 6px solid #dc3545;
}

.error .header {
  background: linear-gradient(135deg, #dc3545, #e74c3c);
  color: white;
}

.warning {
  border-left: 6px solid #ffc107;
}

.warning .header {
  background: linear-gradient(135deg, #ffc107, #f39c12);
  color: #333;
}

.info {
  border-left: 6px solid #007bff;
}

.info .header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
}

/* Modal structure */
.header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
}

.closeButton {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.closeButton:hover {
  opacity: 1;
}

.content {
  padding: 20px;
  line-height: 1.6;
}

/* Responsive design */
@media (max-width: 640px) {
  .modal {
    width: 95%;
    margin: 10px;
  }
  
  .header {
    padding: 12px 16px;
  }
  
  .content {
    padding: 16px;
  }
  
  .title {
    font-size: 1.1em;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .overlay,
  .modal {
    transition: none;
  }
}
```

**Key concepts in dynamic styling:**

1. **Conditional Class Arrays**: Building class names from arrays allows for complex conditional logic while keeping the code readable

2. **State-Based Styling**: Component state directly influences visual appearance, creating responsive user interfaces

3. **Type Safety**: Using union types for the `type` prop ensures only valid style variants can be used

4. **Performance**: CSS transitions and transforms provide smooth animations without JavaScript animation frameworks

5. **Accessibility**: Proper ARIA labels and reduced motion support ensure the component works for all users

### 3. Global Styles Integration

#### Global CSS with CSS Variables
```css
/* src/app/globals.css */
:root {
  --primary-color: #007bff;
  --success-color: #28a745;
  --error-color: #dc3545;
  --warning-color: #ffc107;
  --text-color: #333;
  --border-color: #e0e0e0;
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto';
  line-height: 1.6;
  color: var(--text-color);
  background-color: #f8f9fa;
}

/* Utility classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}
```

---

## MongoDB Integration

MongoDB is a document-based NoSQL database that's particularly well-suited for modern web applications. Unlike traditional relational databases that store data in tables with rigid schemas, MongoDB stores data as flexible documents that can evolve over time. This flexibility is especially valuable in healthcare applications where data requirements often change as medical practices evolve.

### Why MongoDB for Healthcare Applications?

**Advantages of document-based storage:**
- **Flexible Schema**: Medical records can have varying fields without requiring database migrations
- **Nested Data**: Patient records with embedded medical history are naturally represented
- **JSON-like Structure**: Seamless integration with JavaScript/TypeScript applications
- **Horizontal Scaling**: Can handle growing patient databases across multiple servers
- **Rich Queries**: Complex searches across symptoms, syndromes, and patient data

**Healthcare-specific benefits:**
- **Audit Trails**: Document versioning for regulatory compliance
- **Complex Relationships**: Patients can have multiple conditions, medications, and treatments
- **Performance**: Fast queries for time-sensitive medical data access
- **Backup and Recovery**: Built-in replication for data protection

### 1. Database Connection Management

Proper connection management is crucial for production applications. Poor connection handling can lead to memory leaks, performance issues, and application crashes.

#### Connection Utility with Connection Pooling

```typescript
// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB!

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Connection pooling strategy depends on environment
if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the connection
  // This prevents creating multiple connections during Next.js hot reloading
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    })
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, create a new client for each connection
  // This ensures clean connections in serverless environments
  client = new MongoClient(uri, {
    maxPoolSize: 50, // Higher pool size for production
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    minPoolSize: 5, // Maintain minimum connections
  })
  clientPromise = client.connect()
}

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    return client.db(dbName)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw new Error(`Failed to connect to database: ${error.message}`)
  }
}

// Multi-database support for LINE Bot integration
export async function getLineBotDatabase(): Promise<Db> {
  const lineBotUri = process.env.LINEBOT_MONGODB_URI || uri
  const lineBotDbName = process.env.LINEBOT_MONGODB_DB || 'linebot'
  
  try {
    // Create separate client for LINE Bot database
    const lineBotClient = new MongoClient(lineBotUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })
    await lineBotClient.connect()
    return lineBotClient.db(lineBotDbName)
  } catch (error) {
    console.error('LINE Bot database connection error:', error)
    throw new Error(`Failed to connect to LINE Bot database: ${error.message}`)
  }
}

// Health check function for monitoring
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = await getDatabase()
    // Simple ping to verify connection
    await db.admin().ping()
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Graceful shutdown for production deployments
export async function closeDatabaseConnection(): Promise<void> {
  try {
    const client = await clientPromise
    await client.close()
    console.log('Database connection closed gracefully')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}
```

**Key connection management concepts:**

1. **Connection Pooling**: MongoDB automatically manages a pool of connections, reducing overhead of creating new connections for each request

2. **Environment-Specific Strategy**: Different connection strategies for development (persistent) vs. production (fresh connections)

3. **Error Handling**: Comprehensive error handling with meaningful error messages for debugging

4. **Multi-Database Support**: Separate databases for different concerns (main clinic data vs. LINE bot data)

5. **Health Monitoring**: Built-in health checks for monitoring application status

6. **Graceful Shutdown**: Proper cleanup for production deployments

### 2. Data Models and Operations

Effective data modeling in MongoDB requires understanding how documents relate to each other and how they'll be queried. Our TCM system uses an embedded document pattern where patient medical history is stored within the patient document, optimizing for common access patterns.

#### Design Decisions

**Embedded vs. Referenced Documents:**
- **Embedded**: Medical history records are embedded within patient documents
- **Why**: Medical records are always accessed in the context of a specific patient
- **Benefits**: Single query to get patient with complete history, atomic updates
- **Trade-offs**: Document size limits (16MB), but medical records rarely exceed this

**Schema Design Philosophy:**
- **Flexibility**: Fields can be added without migrations
- **Performance**: Structure optimized for common queries (patient search, record retrieval)
- **Consistency**: Core fields are always present, optional fields provide extensibility

#### Patient Model Operations

```typescript
// src/lib/models/patient.ts
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/mongodb'

// TypeScript interfaces define our data structure
export interface Patient {
  _id?: string
  name: string
  lineUserId?: string  // Optional LINE integration
  historyRecords: TCMHistoryRecord[]
  createdAt: Date
  updatedAt: Date
  lastSyncedAt?: Date  // When LINE account was last synced
}

export interface TCMHistoryRecord {
  visitDate: Date
  symptoms: string[]       // Array of symptom descriptions
  syndromes: string[]      // TCM syndrome classifications  
  notes?: string           // Optional physician notes
  createdAt: Date
  updatedAt: Date
}

// Model class encapsulates database operations
export class PatientModel {
  private static collectionName = 'patients'

  // Find a single patient by ID with error handling
  static async findById(id: string): Promise<Patient | null> {
    try {
      const db = await getDatabase()
      
      // Validate ObjectId format to prevent errors
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid patient ID format')
      }
      
      const patient = await db.collection(this.collectionName)
        .findOne({ _id: new ObjectId(id) })
      
      return patient as Patient | null
    } catch (error) {
      console.error('Error finding patient:', error)
      throw new Error(`Failed to find patient: ${error.message}`)
    }
  }

  // Complex search with multiple keyword support
  static async search(keyword: string, limit: number = 50): Promise<Patient[]> {
    try {
      const db = await getDatabase()
      
      // Multi-keyword OR search implementation
      // Example: "王 小明" becomes [{ name: /王/i }, { name: /小明/i }]
      const keywords = keyword.trim().split(/\s+/).filter(k => k.length > 0)
      
      let query = {}
      if (keywords.length > 0) {
        query = {
          $or: keywords.map(kw => ({
            name: { $regex: kw, $options: 'i' }
          }))
        }
      }

      const patients = await db.collection(this.collectionName)
        .find(query)
        .sort({ updatedAt: -1 })  // Most recently updated first
        .limit(limit)             // Prevent overwhelming UI
        .toArray()

      return patients as Patient[]
    } catch (error) {
      console.error('Error searching patients:', error)
      throw new Error(`Search failed: ${error.message}`)
    }
  }

  // Create new patient with validation
  static async create(patientData: Omit<Patient, '_id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    try {
      const db = await getDatabase()
      
      // Validate required fields
      if (!patientData.name?.trim()) {
        throw new Error('Patient name is required')
      }
      
      // Check for duplicate names (business rule)
      const existingPatient = await db.collection(this.collectionName)
        .findOne({ name: patientData.name.trim() })
      
      if (existingPatient) {
        throw new Error('Patient with this name already exists')
      }
      
      const now = new Date()
      const patient: Omit<Patient, '_id'> = {
        ...patientData,
        name: patientData.name.trim(),
        historyRecords: patientData.historyRecords || [],
        createdAt: now,
        updatedAt: now,
      }

      const result = await db.collection(this.collectionName).insertOne(patient)
      
      return {
        ...patient,
        _id: result.insertedId.toString(),
      } as Patient
    } catch (error) {
      console.error('Error creating patient:', error)
      throw new Error(`Failed to create patient: ${error.message}`)
    }
  }

  // Update the most recent medical record
  static async updateRecord(id: string, record: Partial<TCMHistoryRecord>): Promise<boolean> {
    try {
      const db = await getDatabase()
      
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid patient ID format')
      }
      
      const now = new Date()
      const updateData = {
        ...record,
        updatedAt: now,
      }

      // Update the latest record in historyRecords array (position 0)
      const result = await db.collection(this.collectionName).updateOne(
        { 
          _id: new ObjectId(id),
          'historyRecords.0': { $exists: true } // Ensure there's at least one record
        },
        { 
          $set: {
            'historyRecords.0': updateData,  // Update first (latest) record
            updatedAt: now,
          }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error updating record:', error)
      throw new Error(`Failed to update record: ${error.message}`)
    }
  }

  // Add new medical record to patient
  static async addRecord(id: string, record: Omit<TCMHistoryRecord, 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const db = await getDatabase()
      
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid patient ID format')
      }
      
      // Validate record data
      if (!record.visitDate) {
        throw new Error('Visit date is required')
      }
      
      if (!record.symptoms?.length) {
        throw new Error('At least one symptom is required')
      }
      
      const now = new Date()
      const newRecord: TCMHistoryRecord = {
        ...record,
        symptoms: record.symptoms.filter(s => s.trim().length > 0), // Clean empty symptoms
        syndromes: record.syndromes?.filter(s => s.trim().length > 0) || [],
        createdAt: now,
        updatedAt: now,
      }

      // Add new record to the beginning of the array (most recent first)
      const result = await db.collection(this.collectionName).updateOne(
        { _id: new ObjectId(id) },
        { 
          $push: { 
            historyRecords: { 
              $each: [newRecord], 
              $position: 0  // Insert at beginning
            } 
          },
          $set: { updatedAt: now }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error adding record:', error)
      throw new Error(`Failed to add record: ${error.message}`)
    }
  }

  // Get patients with LINE accounts for messaging
  static async findPatientsWithLine(): Promise<Patient[]> {
    try {
      const db = await getDatabase()
      
      const patients = await db.collection(this.collectionName)
        .find({ 
          lineUserId: { $exists: true, $ne: null, $ne: '' }
        })
        .sort({ name: 1 })  // Alphabetical order
        .toArray()

      return patients as Patient[]
    } catch (error) {
      console.error('Error finding patients with LINE:', error)
      throw new Error(`Failed to find patients with LINE: ${error.message}`)
    }
  }
}
```

**Key model design concepts:**

1. **Type Safety**: TypeScript interfaces ensure data consistency across the application

2. **Validation**: Input validation prevents invalid data from entering the database

3. **Error Handling**: Comprehensive error handling with meaningful messages for debugging

4. **Business Logic**: Model methods encapsulate business rules (e.g., duplicate name checking)

5. **Performance**: Optimized queries with proper indexing and result limiting

6. **Atomic Operations**: MongoDB operations are atomic at the document level, ensuring data consistency

### 3. Database Indexes and Performance

#### Index Creation Script
```javascript
// src/scripts/setup-database.js
const { MongoClient } = require('mongodb')

async function setupDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db(process.env.MONGODB_DB)
    
    // Create patients collection indexes
    await db.collection('patients').createIndexes([
      // Name search index
      { key: { name: 'text' }, name: 'name_search' },
      
      // Updated time index for sorting
      { key: { updatedAt: -1 }, name: 'updated_desc' },
      
      // LINE user ID index
      { key: { lineUserId: 1 }, name: 'line_user_id', sparse: true },
      
      // Compound index for history records
      { key: { 'historyRecords.visitDate': -1 }, name: 'visit_date_desc' },
      
      // Symptoms search in history records
      { key: { 'historyRecords.symptoms': 1 }, name: 'symptoms_search' },
    ])

    console.log('Database indexes created successfully')
  } catch (error) {
    console.error('Error setting up database:', error)
  } finally {
    await client.close()
  }
}

setupDatabase()
```

### 4. CRUD Operations

MongoDB provides four fundamental operations for data manipulation: Create, Read, Update, and Delete. Understanding these operations is essential for building robust applications. Each operation has multiple variations depending on whether you're working with single documents or multiple documents.

#### Create Operations

Creating documents in MongoDB can be done using `insertOne()` for single documents or `insertMany()` for multiple documents.

```typescript
// Single document creation
export class PatientModel {
  static async create(patientData: Omit<Patient, '_id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Validate input data
      if (!patientData.name || patientData.name.trim().length === 0) {
        throw new Error('Patient name is required')
      }

      // Check for duplicate names (business rule)
      const existingPatient = await collection.findOne({ 
        name: { $regex: new RegExp(`^${patientData.name}$`, 'i') } 
      })
      
      if (existingPatient) {
        throw new Error('Patient with this name already exists')
      }

      // Prepare document with timestamps
      const newPatient: Omit<Patient, '_id'> = {
        ...patientData,
        historyRecords: patientData.historyRecords || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Insert document and return with generated ID
      const result = await collection.insertOne(newPatient)
      
      return {
        _id: result.insertedId.toString(),
        ...newPatient
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      throw new Error(`Failed to create patient: ${error.message}`)
    }
  }

  // Bulk creation for data migration or initial setup
  static async createMany(patientsData: Omit<Patient, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<Patient[]> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Prepare documents with timestamps
      const newPatients = patientsData.map(patient => ({
        ...patient,
        historyRecords: patient.historyRecords || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      // Bulk insert with ordered: false for better performance
      const result = await collection.insertMany(newPatients, { ordered: false })
      
      // Return documents with their new IDs
      return Object.keys(result.insertedIds).map(index => ({
        _id: result.insertedIds[index].toString(),
        ...newPatients[index]
      }))
    } catch (error) {
      console.error('Error creating patients in bulk:', error)
      throw new Error(`Failed to create patients: ${error.message}`)
    }
  }
}
```

**Key concepts in Create operations:**

1. **Document Validation**: Always validate input data before insertion to maintain data integrity
2. **Business Rules**: Implement domain-specific rules like duplicate checking
3. **Timestamps**: Automatically add `createdAt` and `updatedAt` fields for audit trails
4. **Error Handling**: Provide meaningful error messages for different failure scenarios
5. **Bulk Operations**: Use `insertMany()` for better performance when creating multiple documents

#### Read Operations

Read operations in MongoDB range from simple document retrieval to complex queries with filtering, sorting, and projection.

```typescript
export class PatientModel {
  // Simple document retrieval by ID
  static async findById(id: string): Promise<Patient | null> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Convert string ID to ObjectId and find document
      const patient = await collection.findOne({ 
        _id: new ObjectId(id) 
      })

      if (!patient) {
        return null
      }

      // Convert ObjectId to string for client consumption
      return {
        ...patient,
        _id: patient._id.toString()
      }
    } catch (error) {
      console.error('Error finding patient by ID:', error)
      throw new Error(`Failed to find patient: ${error.message}`)
    }
  }

  // Complex search with multiple criteria
  static async search(
    keyword: string, 
    options: {
      limit?: number
      skip?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      includeInactive?: boolean
    } = {}
  ): Promise<{ patients: Patient[], total: number }> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Build dynamic query based on keyword
      const query: any = {}
      
      if (keyword.trim()) {
        // Support multi-keyword search with AND logic
        const keywords = keyword.trim().split(/\s+/)
        query.$and = keywords.map(kw => ({
          $or: [
            { name: { $regex: kw, $options: 'i' } },
            { lineUserId: { $regex: kw, $options: 'i' } }
          ]
        }))
      }

      // Add activity filter if specified
      if (!options.includeInactive) {
        query.isActive = { $ne: false }
      }

      // Build sort criteria
      const sort: any = {}
      if (options.sortBy) {
        sort[options.sortBy] = options.sortOrder === 'desc' ? -1 : 1
      } else {
        sort.updatedAt = -1 // Default: most recently updated first
      }

      // Execute query with pagination
      const [patients, total] = await Promise.all([
        collection
          .find(query)
          .sort(sort)
          .skip(options.skip || 0)
          .limit(options.limit || 50)
          .toArray(),
        collection.countDocuments(query)
      ])

      // Transform results for client consumption
      const transformedPatients = patients.map(patient => ({
        ...patient,
        _id: patient._id.toString()
      }))

      return {
        patients: transformedPatients,
        total
      }
    } catch (error) {
      console.error('Error searching patients:', error)
      throw new Error(`Failed to search patients: ${error.message}`)
    }
  }

  // Find patients with specific conditions
  static async findPatientsWithCondition(syndrome: string): Promise<Patient[]> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Query nested array fields
      const patients = await collection.find({
        'historyRecords.syndromes': {
          $regex: syndrome,
          $options: 'i'
        }
      }).toArray()

      return patients.map(patient => ({
        ...patient,
        _id: patient._id.toString()
      }))
    } catch (error) {
      console.error('Error finding patients with condition:', error)
      throw new Error(`Failed to find patients with condition: ${error.message}`)
    }
  }

  // Advanced projection - return only specific fields
  static async getPatientSummaries(): Promise<Array<{id: string, name: string, recordCount: number}>> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      const summaries = await collection.find({}, {
        projection: {
          name: 1,
          historyRecords: 1
        }
      }).toArray()

      return summaries.map(patient => ({
        id: patient._id.toString(),
        name: patient.name,
        recordCount: patient.historyRecords?.length || 0
      }))
    } catch (error) {
      console.error('Error getting patient summaries:', error)
      throw new Error(`Failed to get patient summaries: ${error.message}`)
    }
  }
}
```

**Key concepts in Read operations:**

1. **Query Building**: Construct dynamic queries based on input parameters
2. **Indexing**: Use appropriate indexes for better query performance
3. **Projection**: Select only needed fields to reduce data transfer
4. **Pagination**: Implement skip/limit for large result sets
5. **Sorting**: Provide meaningful default sort orders
6. **Nested Queries**: Query array fields and embedded documents

#### Update Operations

Update operations modify existing documents. MongoDB provides several update operators for different types of modifications.

```typescript
export class PatientModel {
  // Update basic patient information
  static async update(id: string, updates: Partial<Patient>): Promise<boolean> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Prepare update document with timestamp
      const updateDoc: any = {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }

      // Remove fields that shouldn't be updated this way
      delete updateDoc.$set._id
      delete updateDoc.$set.createdAt
      delete updateDoc.$set.historyRecords

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error updating patient:', error)
      throw new Error(`Failed to update patient: ${error.message}`)
    }
  }

  // Add new medical record to patient
  static async addRecord(id: string, record: Omit<TCMHistoryRecord, 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Prepare new record with timestamps
      const newRecord: TCMHistoryRecord = {
        ...record,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Use $push to add to array
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $push: { historyRecords: newRecord },
          $set: { updatedAt: new Date() }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error adding record:', error)
      throw new Error(`Failed to add medical record: ${error.message}`)
    }
  }

  // Update specific medical record
  static async updateRecord(
    patientId: string, 
    recordIndex: number, 
    updates: Partial<TCMHistoryRecord>
  ): Promise<boolean> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Build update document for array element
      const updateDoc: any = {
        $set: {
          updatedAt: new Date()
        }
      }

      // Update specific fields in the array element
      Object.keys(updates).forEach(key => {
        if (key !== 'createdAt') { // Don't allow updating creation date
          updateDoc.$set[`historyRecords.${recordIndex}.${key}`] = updates[key]
          updateDoc.$set[`historyRecords.${recordIndex}.updatedAt`] = new Date()
        }
      })

      const result = await collection.updateOne(
        { _id: new ObjectId(patientId) },
        updateDoc
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error updating record:', error)
      throw new Error(`Failed to update medical record: ${error.message}`)
    }
  }

  // Bulk update multiple patients
  static async bulkUpdate(updates: Array<{id: string, data: Partial<Patient>}>): Promise<number> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Prepare bulk operations
      const bulkOps = updates.map(update => ({
        updateOne: {
          filter: { _id: new ObjectId(update.id) },
          update: {
            $set: {
              ...update.data,
              updatedAt: new Date()
            }
          }
        }
      }))

      const result = await collection.bulkWrite(bulkOps)
      return result.modifiedCount
    } catch (error) {
      console.error('Error in bulk update:', error)
      throw new Error(`Failed to bulk update patients: ${error.message}`)
    }
  }

  // Increment counter fields
  static async incrementVisitCount(id: string): Promise<boolean> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: { visitCount: 1 }, // Increment by 1
          $set: { 
            lastVisitDate: new Date(),
            updatedAt: new Date() 
          }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error incrementing visit count:', error)
      throw new Error(`Failed to increment visit count: ${error.message}`)
    }
  }
}
```

**Key concepts in Update operations:**

1. **Update Operators**: Use `$set`, `$push`, `$inc`, etc. for different update types
2. **Array Updates**: Update specific array elements using positional operators
3. **Bulk Operations**: Use `bulkWrite()` for efficient multiple updates
4. **Atomic Updates**: MongoDB ensures document-level atomicity
5. **Timestamps**: Always update `updatedAt` field for audit trails
6. **Validation**: Validate updates before applying them

#### Delete Operations

Delete operations remove documents from collections. Always consider soft deletes for important data like medical records.

```typescript
export class PatientModel {
  // Soft delete - preferred for medical records
  static async softDelete(id: string, deletedBy: string): Promise<boolean> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: deletedBy,
            updatedAt: new Date()
          }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error soft deleting patient:', error)
      throw new Error(`Failed to delete patient: ${error.message}`)
    }
  }

  // Hard delete - use with extreme caution
  static async hardDelete(id: string): Promise<boolean> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Create backup before deletion
      const patient = await collection.findOne({ _id: new ObjectId(id) })
      if (patient) {
        const backupCollection = db.collection('deleted_patients')
        await backupCollection.insertOne({
          ...patient,
          originalId: patient._id,
          deletedAt: new Date()
        })
      }

      const result = await collection.deleteOne({ _id: new ObjectId(id) })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error hard deleting patient:', error)
      throw new Error(`Failed to permanently delete patient: ${error.message}`)
    }
  }

  // Remove specific medical record
  static async removeRecord(patientId: string, recordIndex: number): Promise<boolean> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Use $unset to remove array element, then $pull to remove null
      await collection.updateOne(
        { _id: new ObjectId(patientId) },
        { $unset: { [`historyRecords.${recordIndex}`]: 1 } }
      )

      const result = await collection.updateOne(
        { _id: new ObjectId(patientId) },
        { 
          $pull: { historyRecords: null },
          $set: { updatedAt: new Date() }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error removing record:', error)
      throw new Error(`Failed to remove medical record: ${error.message}`)
    }
  }

  // Bulk delete with conditions
  static async bulkDelete(conditions: any): Promise<number> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>(this.collectionName)

      // Safer to soft delete in bulk
      const result = await collection.updateMany(
        conditions,
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        }
      )

      return result.modifiedCount
    } catch (error) {
      console.error('Error in bulk delete:', error)
      throw new Error(`Failed to bulk delete patients: ${error.message}`)
    }
  }
}
```

**Key concepts in Delete operations:**

1. **Soft vs Hard Delete**: Prefer soft deletes for important data
2. **Backup Strategy**: Create backups before permanent deletion
3. **Array Element Removal**: Use `$unset` and `$pull` for array elements
4. **Bulk Operations**: Efficient deletion of multiple documents
5. **Audit Trails**: Track who deleted what and when
6. **Recovery**: Implement recovery mechanisms for accidentally deleted data

### 5. Aggregation Pipeline

MongoDB's aggregation framework is one of its most powerful features, allowing complex data processing and analysis. The aggregation pipeline processes documents through multiple stages, each performing a specific operation.

#### Understanding the Aggregation Pipeline

The aggregation pipeline works like a Unix pipeline, where the output of one stage becomes the input to the next stage. This allows for complex data transformations and analysis.

**Common Pipeline Stages:**
- `$match`: Filter documents (similar to WHERE in SQL)
- `$group`: Group documents and perform calculations
- `$project`: Select and transform fields
- `$sort`: Sort documents
- `$limit` / `$skip`: Pagination
- `$lookup`: Join with other collections
- `$unwind`: Deconstruct array fields
- `$addFields`: Add computed fields

#### Medical Records Analytics

```typescript
export class AnalyticsModel {
  // Symptom frequency analysis
  static async getSymptomFrequency(dateRange?: { start: Date, end: Date }): Promise<Array<{symptom: string, count: number, percentage: number}>> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>('patients')

      const pipeline: any[] = [
        // Stage 1: Unwind history records to work with individual records
        { $unwind: '$historyRecords' },
        
        // Stage 2: Filter by date range if provided
        ...(dateRange ? [{
          $match: {
            'historyRecords.visitDate': {
              $gte: dateRange.start,
              $lte: dateRange.end
            }
          }
        }] : []),
        
        // Stage 3: Unwind symptoms array to work with individual symptoms
        { $unwind: '$historyRecords.symptoms' },
        
        // Stage 4: Group by symptom and count occurrences
        {
          $group: {
            _id: '$historyRecords.symptoms',
            count: { $sum: 1 },
            patients: { $addToSet: '$_id' } // Collect unique patient IDs
          }
        },
        
        // Stage 5: Add patient count and calculate percentage
        {
          $addFields: {
            symptom: '$_id',
            patientCount: { $size: '$patients' }
          }
        },
        
        // Stage 6: Get total count for percentage calculation
        {
          $group: {
            _id: null,
            symptoms: {
              $push: {
                symptom: '$symptom',
                count: '$count',
                patientCount: '$patientCount'
              }
            },
            totalOccurrences: { $sum: '$count' }
          }
        },
        
        // Stage 7: Calculate percentages and format output
        {
          $project: {
            symptoms: {
              $map: {
                input: '$symptoms',
                as: 'symptom',
                in: {
                  symptom: '$$symptom.symptom',
                  count: '$$symptom.count',
                  patientCount: '$$symptom.patientCount',
                  percentage: {
                    $round: [
                      { $multiply: [{ $divide: ['$$symptom.count', '$totalOccurrences'] }, 100] },
                      2
                    ]
                  }
                }
              }
            }
          }
        },
        
        // Stage 8: Unwind to flatten results
        { $unwind: '$symptoms' },
        
        // Stage 9: Replace root to get clean output
        { $replaceRoot: { newRoot: '$symptoms' } },
        
        // Stage 10: Sort by frequency
        { $sort: { count: -1 } },
        
        // Stage 11: Limit to top 20 symptoms
        { $limit: 20 }
      ]

      const results = await collection.aggregate(pipeline).toArray()
      return results
    } catch (error) {
      console.error('Error analyzing symptom frequency:', error)
      throw new Error(`Failed to analyze symptom frequency: ${error.message}`)
    }
  }

  // Monthly visit trends
  static async getMonthlyVisitTrends(year: number): Promise<Array<{month: string, visitCount: number, newPatients: number}>> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>('patients')

      const pipeline = [
        // Stage 1: Unwind history records
        { $unwind: '$historyRecords' },
        
        // Stage 2: Filter by year
        {
          $match: {
            'historyRecords.visitDate': {
              $gte: new Date(`${year}-01-01`),
              $lt: new Date(`${year + 1}-01-01`)
            }
          }
        },
        
        // Stage 3: Group by month
        {
          $group: {
            _id: {
              month: { $month: '$historyRecords.visitDate' },
              year: { $year: '$historyRecords.visitDate' }
            },
            visitCount: { $sum: 1 },
            uniquePatients: { $addToSet: '$_id' }
          }
        },
        
        // Stage 4: Add month names and patient counts
        {
          $addFields: {
            month: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id.month', 1] }, then: 'January' },
                  { case: { $eq: ['$_id.month', 2] }, then: 'February' },
                  { case: { $eq: ['$_id.month', 3] }, then: 'March' },
                  { case: { $eq: ['$_id.month', 4] }, then: 'April' },
                  { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                  { case: { $eq: ['$_id.month', 6] }, then: 'June' },
                  { case: { $eq: ['$_id.month', 7] }, then: 'July' },
                  { case: { $eq: ['$_id.month', 8] }, then: 'August' },
                  { case: { $eq: ['$_id.month', 9] }, then: 'September' },
                  { case: { $eq: ['$_id.month', 10] }, then: 'October' },
                  { case: { $eq: ['$_id.month', 11] }, then: 'November' },
                  { case: { $eq: ['$_id.month', 12] }, then: 'December' }
                ],
                default: 'Unknown'
              }
            },
            patientCount: { $size: '$uniquePatients' }
          }
        },
        
        // Stage 5: Calculate new patients for each month
        {
          $lookup: {
            from: 'patients',
            let: { 
              currentMonth: '$_id.month',
              currentYear: '$_id.year',
              currentPatients: '$uniquePatients'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$_id', '$$currentPatients'] },
                      { $eq: [{ $month: '$createdAt' }, '$$currentMonth'] },
                      { $eq: [{ $year: '$createdAt' }, '$$currentYear'] }
                    ]
                  }
                }
              }
            ],
            as: 'newPatientsThisMonth'
          }
        },
        
        // Stage 6: Format final output
        {
          $project: {
            month: 1,
            visitCount: 1,
            newPatients: { $size: '$newPatientsThisMonth' }
          }
        },
        
        // Stage 7: Sort by month
        { $sort: { '_id.month': 1 } }
      ]

      const results = await collection.aggregate(pipeline).toArray()
      return results
    } catch (error) {
      console.error('Error analyzing monthly trends:', error)
      throw new Error(`Failed to analyze monthly trends: ${error.message}`)
    }
  }

  // Patient journey analysis
  static async getPatientJourney(patientId: string): Promise<{
    totalVisits: number,
    avgDaysBetweenVisits: number,
    symptomProgression: Array<{date: Date, symptoms: string[], syndromes: string[]}>,
    treatmentEffectiveness: number
  }> {
    try {
      const db = await getDatabase()
      const collection = db.collection<Patient>('patients')

      const pipeline = [
        // Stage 1: Match specific patient
        { $match: { _id: new ObjectId(patientId) } },
        
        // Stage 2: Unwind history records
        { $unwind: '$historyRecords' },
        
        // Stage 3: Sort by visit date
        { $sort: { 'historyRecords.visitDate': 1 } },
        
        // Stage 4: Group back to patient with ordered records
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            orderedRecords: { $push: '$historyRecords' },
            totalVisits: { $sum: 1 },
            firstVisit: { $min: '$historyRecords.visitDate' },
            lastVisit: { $max: '$historyRecords.visitDate' }
          }
        },
        
        // Stage 5: Calculate metrics
        {
          $addFields: {
            daysBetweenFirstAndLast: {
              $divide: [
                { $subtract: ['$lastVisit', '$firstVisit'] },
                1000 * 60 * 60 * 24 // Convert milliseconds to days
              ]
            },
            avgDaysBetweenVisits: {
              $cond: {
                if: { $gt: ['$totalVisits', 1] },
                then: {
                  $divide: [
                    { $subtract: ['$lastVisit', '$firstVisit'] },
                    { $multiply: [{ $subtract: ['$totalVisits', 1] }, 1000 * 60 * 60 * 24] }
                  ]
                },
                else: 0
              }
            }
          }
        }
      ]

      const [result] = await collection.aggregate(pipeline).toArray()
      
      if (!result) {
        throw new Error('Patient not found')
      }

      // Calculate treatment effectiveness (simplified metric)
      const symptomProgression = result.orderedRecords.map(record => ({
        date: record.visitDate,
        symptoms: record.symptoms,
        syndromes: record.syndromes
      }))

      // Simple effectiveness calculation: reduction in symptom count over time
      let treatmentEffectiveness = 0
      if (symptomProgression.length > 1) {
        const firstVisitSymptoms = symptomProgression[0].symptoms.length
        const lastVisitSymptoms = symptomProgression[symptomProgression.length - 1].symptoms.length
        
        if (firstVisitSymptoms > 0) {
          treatmentEffectiveness = Math.max(0, 
            Math.round(((firstVisitSymptoms - lastVisitSymptoms) / firstVisitSymptoms) * 100)
          )
        }
      }

      return {
        totalVisits: result.totalVisits,
        avgDaysBetweenVisits: Math.round(result.avgDaysBetweenVisits || 0),
        symptomProgression,
        treatmentEffectiveness
      }
    } catch (error) {
      console.error('Error analyzing patient journey:', error)
      throw new Error(`Failed to analyze patient journey: ${error.message}`)
    }
  }
}
```

**Key concepts in Aggregation:**

1. **Pipeline Stages**: Each stage transforms the data for the next stage
2. **Performance**: Use `$match` early to reduce documents processed
3. **Memory Management**: Large aggregations may require `allowDiskUse: true`
4. **Complex Calculations**: Use `$addFields`, `$project` for computed fields
5. **Joins**: Use `$lookup` to join data from other collections
6. **Grouping**: `$group` stage enables statistical analysis

### 6. MongoDB vs ORM Comparison

Understanding when to use MongoDB directly versus an ORM (Object-Relational Mapping) tool is crucial for making informed architecture decisions. Both approaches have their place in modern web development.

#### Direct MongoDB Driver Approach (Current Implementation)

**Advantages:**

1. **Full Control and Performance**
```typescript
// Direct MongoDB - Full control over queries
const pipeline = [
  { $match: { 'historyRecords.visitDate': { $gte: startDate } } },
  { $unwind: '$historyRecords' },
  { $group: { _id: '$historyRecords.symptoms', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]
const results = await collection.aggregate(pipeline).toArray()
```

2. **No Abstraction Overhead**
   - Direct access to all MongoDB features
   - No performance penalties from ORM translations
   - Complete control over query optimization

3. **MongoDB-Specific Features**
   - Full aggregation pipeline access
   - Advanced indexing strategies
   - MongoDB Atlas Search integration

4. **Learning Value**
   - Deep understanding of database operations
   - Better debugging capabilities
   - Direct exposure to MongoDB concepts

**Disadvantages:**

1. **More Boilerplate Code**
```typescript
// Manual connection management
const db = await getDatabase()
const collection = db.collection<Patient>('patients')

// Manual error handling
try {
  const result = await collection.findOne({ _id: new ObjectId(id) })
  return result ? { ...result, _id: result._id.toString() } : null
} catch (error) {
  console.error('Database error:', error)
  throw new Error(`Failed to find patient: ${error.message}`)
}
```

2. **Type Safety Challenges**
   - Manual type assertions
   - No compile-time query validation
   - Potential runtime type mismatches

3. **Development Velocity**
   - More code to write and maintain
   - Manual relationship management
   - Custom validation implementation

#### ORM Approach (Mongoose Example)

**What an ORM Implementation Would Look Like:**

```typescript
// Schema definition with Mongoose
import mongoose, { Schema, Document } from 'mongoose'

interface IPatient extends Document {
  name: string
  lineUserId?: string
  historyRecords: ITCMHistoryRecord[]
  createdAt: Date
  updatedAt: Date
}

interface ITCMHistoryRecord {
  visitDate: Date
  symptoms: string[]
  syndromes: string[]
  notes?: string
}

const TCMHistoryRecordSchema = new Schema({
  visitDate: { type: Date, required: true },
  symptoms: [{ type: String, required: true }],
  syndromes: [{ type: String, required: true }],
  notes: String
}, { timestamps: true })

const PatientSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100,
    validate: {
      validator: function(v: string) {
        return v.length > 0
      },
      message: 'Patient name cannot be empty'
    }
  },
  lineUserId: { 
    type: String, 
    sparse: true, 
    unique: true 
  },
  historyRecords: [TCMHistoryRecordSchema]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual fields
PatientSchema.virtual('recordCount').get(function() {
  return this.historyRecords.length
})

// Instance methods
PatientSchema.methods.addRecord = function(record: Omit<ITCMHistoryRecord, 'createdAt' | 'updatedAt'>) {
  this.historyRecords.push(record)
  return this.save()
}

// Static methods
PatientSchema.statics.findByName = function(name: string) {
  return this.find({ name: new RegExp(name, 'i') })
}

// Middleware
PatientSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim()
  }
  next()
})

const Patient = mongoose.model<IPatient>('Patient', PatientSchema)

// Usage examples
export class PatientORMModel {
  // Simple creation with built-in validation
  static async create(patientData: Partial<IPatient>): Promise<IPatient> {
    const patient = new Patient(patientData)
    return await patient.save() // Auto-validation and timestamps
  }

  // Simplified querying
  static async findByName(name: string): Promise<IPatient[]> {
    return await Patient.findByName(name)
      .populate('someRelatedField') // Auto-population
      .exec()
  }

  // Built-in relationship handling
  static async addRecord(patientId: string, record: ITCMHistoryRecord): Promise<IPatient | null> {
    const patient = await Patient.findById(patientId)
    if (!patient) return null
    
    return await patient.addRecord(record) // Instance method
  }

  // Simplified aggregation (but less flexible)
  static async getSymptomCounts(): Promise<any[]> {
    return await Patient.aggregate([
      { $unwind: '$historyRecords' },
      { $unwind: '$historyRecords.symptoms' },
      { $group: { _id: '$historyRecords.symptoms', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  }
}
```

**ORM Advantages:**

1. **Rapid Development**
   - Built-in validation and middleware
   - Automatic relationship management
   - Less boilerplate code

2. **Type Safety and IntelliSense**
   - Schema-based type generation
   - Compile-time validation
   - Better IDE support

3. **Built-in Features**
   - Automatic timestamps
   - Virtual fields
   - Middleware hooks
   - Connection pooling

4. **Consistency**
   - Standardized patterns
   - Easier team collaboration
   - Reduced learning curve

**ORM Disadvantages:**

1. **Performance Overhead**
   - Additional abstraction layer
   - Potentially inefficient queries
   - Memory overhead

2. **Limited MongoDB Features**
   - Complex aggregations may not be supported
   - Limited access to MongoDB-specific features
   - May not support latest MongoDB features

3. **Learning Curve**
   - ORM-specific concepts and patterns
   - Another layer of abstraction to understand
   - Debugging ORM-generated queries

#### Hybrid Approach Recommendation

For many applications, a hybrid approach works best:

```typescript
// Use ORM for simple operations
export class PatientService {
  // Simple CRUD with ORM
  static async create(data: CreatePatientRequest): Promise<Patient> {
    return await PatientORMModel.create(data)
  }

  static async findById(id: string): Promise<Patient | null> {
    return await PatientORMModel.findById(id)
  }

  // Complex analytics with direct MongoDB
  static async getAdvancedAnalytics(params: AnalyticsParams): Promise<AnalyticsResult> {
    const db = await getDatabase()
    // Use complex aggregation pipeline directly
    return await AnalyticsModel.getSymptomFrequency(params.dateRange)
  }

  // Performance-critical operations with direct MongoDB
  static async bulkOperations(operations: BulkOperation[]): Promise<BulkResult> {
    const db = await getDatabase()
    const collection = db.collection<Patient>('patients')
    return await collection.bulkWrite(operations)
  }
}
```

#### Decision Matrix: When to Use What

| Use Case | Direct MongoDB | ORM (Mongoose) | Reasoning |
|----------|---------------|----------------|-----------|
| Simple CRUD operations | ⚠️ Verbose | ✅ Ideal | ORM reduces boilerplate |
| Complex aggregations | ✅ Full power | ❌ Limited | Need full pipeline access |
| Performance-critical queries | ✅ Optimized | ⚠️ Overhead | Direct control needed |
| Rapid prototyping | ❌ Slow | ✅ Fast | Built-in validation/features |
| Team with MongoDB expertise | ✅ Best fit | ⚠️ Unnecessary | Leverage existing knowledge |
| New development team | ❌ Steep curve | ✅ Easier | Standardized patterns |
| Healthcare/audit requirements | ✅ Full control | ⚠️ Limitations | Need custom audit trails |
| High-scale applications | ✅ Performance | ❌ Overhead | Every millisecond matters |

#### Conclusion: Why We Chose Direct MongoDB

For the TCM clinic system, we chose direct MongoDB access because:

1. **Medical Data Complexity**: Healthcare data often requires complex queries and aggregations that ORMs struggle with
2. **Performance Requirements**: Medical applications need fast response times for patient data access
3. **Learning Opportunity**: Direct MongoDB usage provides deeper database understanding
4. **Flexibility**: Medical requirements often change, requiring custom database operations
5. **Audit and Compliance**: Healthcare systems need detailed control over data access and modifications

However, as the application grows, we might introduce an ORM for simple operations while keeping direct MongoDB access for complex analytics and performance-critical operations.

### 7. Advanced Query Patterns

#### Weekly Records Aggregation
```typescript
// src/lib/models/records.ts
export class RecordsModel {
  static async getWeeklyRecords() {
    const db = await getDatabase()
    
    // Calculate Monday to Sunday range
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() + diff)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // MongoDB aggregation pipeline
    const pipeline = [
      {
        $unwind: '$historyRecords'
      },
      {
        $match: {
          'historyRecords.visitDate': {
            $gte: startOfWeek,
            $lte: endOfWeek
          }
        }
      },
      {
        $project: {
          name: 1,
          lineUserId: 1,
          visitDate: '$historyRecords.visitDate',
          symptoms: '$historyRecords.symptoms',
          syndromes: '$historyRecords.syndromes',
          notes: '$historyRecords.notes'
        }
      },
      {
        $sort: { visitDate: -1 }
      }
    ]

    const records = await db.collection('patients').aggregate(pipeline).toArray()
    return records
  }
}
```

---

## LINE API Client

### 1. API Client Setup with Rate Limiting

#### LINE API Client Implementation
```typescript
// src/lib/line-api.ts
interface LineUser {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface PushMessageRequest {
  to: string
  messages: LineMessage[]
}

interface LineMessage {
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker'
  text?: string
  originalContentUrl?: string
  previewImageUrl?: string
}

class LineApiClient {
  private baseUrl = 'https://api.line.me/v2/bot'
  private accessToken: string
  private rateLimitDelay = 100 // milliseconds between requests

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`LINE API Error: ${response.status} - ${errorText}`)
      }

      // Handle empty responses
      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      console.error('LINE API request failed:', error)
      throw error
    }
  }

  async getUserProfile(userId: string): Promise<LineUser> {
    return this.makeRequest<LineUser>(`/profile/${userId}`)
  }

  async pushMessage(to: string, messages: LineMessage[]): Promise<void> {
    const data: PushMessageRequest = { to, messages }
    
    await this.makeRequest('/message/push', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async batchPushMessages(
    userIds: string[], 
    messages: LineMessage[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] }
    const BATCH_SIZE = 10 // Avoid rate limiting

    // Process in batches
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE)
      
      // Process batch concurrently but with rate limiting
      const batchPromises = batch.map(async (userId, index) => {
        try {
          // Stagger requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, index * this.rateLimitDelay))
          
          await this.pushMessage(userId, messages)
          results.success++
        } catch (error) {
          results.failed++
          results.errors.push(`Failed to send to ${userId}: ${error.message}`)
        }
      })

      await Promise.all(batchPromises)
      
      // Delay between batches
      if (i + BATCH_SIZE < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }
}

// Singleton instance
let lineApiClient: LineApiClient | null = null

export function getLineApiClient(): LineApiClient {
  if (!lineApiClient) {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
    }
    lineApiClient = new LineApiClient(accessToken)
  }
  return lineApiClient
}

export { LineApiClient, type LineUser, type LineMessage }
```

### 2. Integration with Database

#### LINE User Sync Implementation
```typescript
// src/app/api/sync/line-users/route.ts
import { NextResponse } from 'next/server'
import { getDatabase, getLineBotDatabase } from '@/lib/mongodb'
import { getLineApiClient } from '@/lib/line-api'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface SyncResult {
  total_line_users: number
  matched_patients: number
  updated_patients: number
  already_synced: number
  failed_syncs: number
  errors: string[]
}

export async function POST(): Promise<NextResponse<SyncResult>> {
  // Authentication check
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const [mainDb, lineBotDb] = await Promise.all([
      getDatabase(),
      getLineBotDatabase()
    ])
    
    const lineApiClient = getLineApiClient()
    
    // Get all LINE users from linebot database
    const lineUsers = await lineBotDb.collection('users').find({}).toArray()
    
    const result: SyncResult = {
      total_line_users: lineUsers.length,
      matched_patients: 0,
      updated_patients: 0,
      already_synced: 0,
      failed_syncs: 0,
      errors: []
    }

    // Process each LINE user
    for (const lineUser of lineUsers) {
      try {
        // Get user profile from LINE API
        const profile = await lineApiClient.getUserProfile(lineUser.userId)
        
        // Find matching patient by name (fuzzy matching)
        const namePattern = profile.displayName.replace(/\s+/g, '.*')
        const patient = await mainDb.collection('patients').findOne({
          name: { $regex: namePattern, $options: 'i' }
        })

        if (patient) {
          result.matched_patients++
          
          // Check if already synced
          if (patient.lineUserId === lineUser.userId) {
            result.already_synced++
            continue
          }

          // Update patient with LINE user ID
          const updateResult = await mainDb.collection('patients').updateOne(
            { _id: patient._id },
            {
              $set: {
                lineUserId: lineUser.userId,
                lastSyncedAt: new Date()
              }
            }
          )

          if (updateResult.modifiedCount > 0) {
            result.updated_patients++
          }
        }
      } catch (error) {
        result.failed_syncs++
        result.errors.push(`Failed to sync user ${lineUser.userId}: ${error.message}`)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Sync operation failed' },
      { status: 500 }
    )
  }
}
```

### 3. Notification System

#### Bulk Notification API
```typescript
// src/app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getLineApiClient, LineMessage } from '@/lib/line-api'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface NotificationRequest {
  patientIds: string[]
  message: string
  url?: string
}

interface NotificationResult {
  total_patients: number
  patients_with_line: number
  notifications_sent: number
  notifications_failed: number
  errors: string[]
}

export async function POST(request: NextRequest): Promise<NextResponse<NotificationResult>> {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const body: NotificationRequest = await request.json()
    const { patientIds, message, url } = body

    // Validate input
    if (!patientIds?.length || !message) {
      return NextResponse.json(
        { error: 'Patient IDs and message are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const lineApiClient = getLineApiClient()

    // Get patients with LINE user IDs
    const patients = await db.collection('patients').find({
      _id: { $in: patientIds.map(id => new ObjectId(id)) },
      lineUserId: { $exists: true, $ne: null }
    }).toArray()

    const result: NotificationResult = {
      total_patients: patientIds.length,
      patients_with_line: patients.length,
      notifications_sent: 0,
      notifications_failed: 0,
      errors: []
    }

    if (patients.length === 0) {
      return NextResponse.json(result)
    }

    // Prepare LINE messages
    const messages: LineMessage[] = [
      { type: 'text', text: message }
    ]

    // Add URL if provided
    if (url) {
      messages.push({ type: 'text', text: url })
    }

    // Send notifications in batches
    const lineUserIds = patients.map(p => p.lineUserId).filter(Boolean)
    const batchResult = await lineApiClient.batchPushMessages(lineUserIds, messages)

    result.notifications_sent = batchResult.success
    result.notifications_failed = batchResult.failed
    result.errors = batchResult.errors

    return NextResponse.json(result)
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
```

---

## Project Architecture

### 1. Folder Structure Best Practices

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # Patient management
│   │   ├── notifications/ # LINE messaging
│   │   └── sync/          # Data synchronization
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard
│   ├── edit/[id]/         # Dynamic edit pages
│   └── patient/[id]/      # Patient detail pages
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── mongodb.ts        # Database connection
│   ├── line-api.ts       # LINE API client
│   ├── auth.ts           # NextAuth configuration
│   └── utils.ts          # General utilities
├── types/                # TypeScript type definitions
│   ├── user.ts           # User and patient types
│   ├── api.ts            # API response types
│   └── auth.ts           # Authentication types
├── hooks/                # Custom React hooks
├── styles/               # Shared stylesheets
└── constants/            # Application constants
```

### 2. Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Client Components  │────▶│   API Routes    │────▶│    Database     │
│                 │     │                 │     │                 │
│ - Search Form   │     │ - /api/users    │     │ - MongoDB       │
│ - User Cards    │     │ - /api/records  │     │ - Patients      │
│ - Notifications │     │ - /api/sync     │     │ - Records       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │               ┌─────────────────┐               │
         │               │  External APIs  │               │
         │               │                 │               │
         │               │ - LINE Message  │               │
         │               │ - Google OAuth  │               │
         │               └─────────────────┘               │
         │                                                 │
         ▼                                                 │
┌─────────────────┐                                       │
│ Server Components │◀─────────────────────────────────────┘
│                 │
│ - Patient List  │
│ - Record Views  │
│ - Dashboard     │
└─────────────────┘
```

### 3. State Management Strategy

#### Client State (React Hooks)
```typescript
// src/hooks/usePatients.ts
import { useState, useEffect, useCallback } from 'react'

interface UsePatients {
  patients: Patient[]
  loading: boolean
  error: string | null
  searchPatients: (keyword: string) => Promise<void>
  refreshPatients: () => Promise<void>
}

export function usePatients(): UsePatients {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchPatients = useCallback(async (keyword: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/users?keyword=${encodeURIComponent(keyword)}`)
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      setPatients(data.patients || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPatients = useCallback(async () => {
    await searchPatients('')
  }, [searchPatients])

  return {
    patients,
    loading,
    error,
    searchPatients,
    refreshPatients
  }
}
```

#### Server State (Database)
```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache'
import { PatientModel } from '@/lib/models/patient'

// Cache patient data for 5 minutes
export const getCachedPatients = unstable_cache(
  async (keyword: string) => {
    return await PatientModel.search(keyword)
  },
  ['patients-search'],
  { revalidate: 300 }
)

// Cache weekly records for 1 hour
export const getCachedWeeklyRecords = unstable_cache(
  async () => {
    return await RecordsModel.getWeeklyRecords()
  },
  ['weekly-records'],
  { revalidate: 3600 }
)
```

---

## Best Practices

### 1. Error Handling

#### API Error Handling
```typescript
// src/lib/api-utils.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

// Usage in API routes
export async function GET(request: NextRequest) {
  try {
    // API logic here
    const result = await someOperation()
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### Client Error Handling
```typescript
// src/hooks/useErrorHandler.ts
import { useState, useCallback } from 'react'

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error.message)
    } else {
      setError('An unexpected error occurred')
    }
    
    // Log to monitoring service
    console.error('Client error:', error)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
```

### 2. Performance Optimization

#### Database Query Optimization
```typescript
// Efficient patient search with projection
export async function searchPatients(keyword: string) {
  const db = await getDatabase()
  
  return await db.collection('patients')
    .find(
      { name: { $regex: keyword, $options: 'i' } },
      { 
        projection: {
          name: 1,
          lineUserId: 1,
          'historyRecords': { $slice: 1 }, // Only latest record
          updatedAt: 1
        }
      }
    )
    .sort({ updatedAt: -1 })
    .limit(20)
    .toArray()
}
```

#### Component Performance
```typescript
// src/components/PatientList.tsx
import { memo, useMemo } from 'react'

interface PatientListProps {
  patients: Patient[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

const PatientList = memo(function PatientList({
  patients,
  selectedIds,
  onSelectionChange
}: PatientListProps) {
  // Memoize expensive computations
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  
  const handlePatientSelect = useCallback((patientId: string) => {
    const newSelection = selectedSet.has(patientId)
      ? selectedIds.filter(id => id !== patientId)
      : [...selectedIds, patientId]
    
    onSelectionChange(newSelection)
  }, [selectedIds, selectedSet, onSelectionChange])

  return (
    <div>
      {patients.map(patient => (
        <PatientCard
          key={patient._id}
          patient={patient}
          isSelected={selectedSet.has(patient._id)}
          onSelect={handlePatientSelect}
        />
      ))}
    </div>
  )
})

export default PatientList
```

### 3. Security Best Practices

#### Input Validation
```typescript
// src/lib/validation.ts
import { z } from 'zod'

export const patientSchema = z.object({
  name: z.string().min(1).max(100),
  lineUserId: z.string().optional(),
})

export const recordSchema = z.object({
  visitDate: z.string().pipe(z.coerce.date()),
  symptoms: z.array(z.string()).min(1),
  syndromes: z.array(z.string()),
  notes: z.string().optional(),
})

export function validatePatient(data: unknown) {
  return patientSchema.parse(data)
}

export function validateRecord(data: unknown) {
  return recordSchema.parse(data)
}
```

#### Environment Variable Validation
```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  MONGODB_URI: z.string().url(),
  MONGODB_DB: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

### 4. Testing Strategy

#### API Route Testing
```typescript
// src/__tests__/api/users.test.ts
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/users/route'

// Mock dependencies
jest.mock('@/lib/mongodb')
jest.mock('next-auth')

describe('/api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return patients for authenticated user', async () => {
    // Mock session
    require('next-auth').getServerSession.mockResolvedValue({
      user: { id: '1', email: 'test@example.com' }
    })

    // Mock database
    require('@/lib/mongodb').getDatabase.mockResolvedValue({
      collection: () => ({
        find: () => ({
          sort: () => ({
            limit: () => ({
              toArray: () => Promise.resolve([
                { _id: '1', name: 'Test Patient' }
              ])
            })
          })
        })
      })
    })

    const request = new NextRequest('http://localhost/api/users?keyword=test')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.patients).toHaveLength(1)
  })

  it('should return 401 for unauthenticated user', async () => {
    require('next-auth').getServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/users')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })
})
```

#### Component Testing
```typescript
// src/__tests__/components/SearchForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SearchForm from '@/components/SearchForm'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

describe('SearchForm', () => {
  it('should submit search with keyword', async () => {
    const mockOnSearch = jest.fn()
    
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('Search patients...')
    const button = screen.getByText('Search')
    
    fireEvent.change(input, { target: { value: 'test patient' } })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test patient')
    })
  })
})
```

---

## Conclusion

This technical guide demonstrates how modern web development concepts are applied in a real-world TCM clinic management system:

- **Next.js** provides the foundation with its App Router, SSR/CSR capabilities, and API routes
- **NextAuth.js** handles secure authentication with Google OAuth
- **CSS Modules** enable component-scoped styling with good maintainability
- **MongoDB** serves as a flexible document database with proper indexing and aggregation
- **LINE API** integration shows external API consumption with rate limiting and error handling

Each technology is used appropriately for its strengths, creating a cohesive and maintainable application architecture.