import { signOut } from 'next-auth/react';

// API Client 封裝
export class ApiClient {
  private static async handleResponse(response: Response) {
    // 如果是 401 (未認證) 或 403 (無權限)，重定向到登入頁面
    if (response.status === 401 || response.status === 403 || response.status === 302 || response.redirected) {
        await signOut({ callbackUrl: '/auth/signin', redirect: true });
        throw new Error('AUTH_REDIRECT');
    }

    // 如果不是 JSON 回應，直接回傳 response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return response;
    }

    try {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Response parsing error:', error);
      throw error;
    }
  }

  static async get(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  }

  static async post(url: string, data: any = {}, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  }

  static async put(url: string, data: any = {}, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API PUT error:', error);
      throw error;
    }
  }

  static async delete(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API DELETE error:', error);
      throw error;
    }
  }
}

// 便利的導出函數
export const api = {
  get: ApiClient.get.bind(ApiClient),
  post: ApiClient.post.bind(ApiClient),
  put: ApiClient.put.bind(ApiClient),
  delete: ApiClient.delete.bind(ApiClient),
};