/**
 * LINE Message API Client
 * 提供 LINE Bot 相關的 API 功能
 */

const LINE_API_BASE_URL = 'https://api.line.me/v2/bot';

interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
}

interface PushMessageRequest {
  to: string;
  messages: Array<{
    type: 'text';
    text: string;
  }>;
}

class LineApiClient {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
    if (!this.accessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
    }
  }

  /**
   * 取得 LINE 用戶的個人資料
   * @param userId LINE 用戶 ID
   * @returns 用戶個人資料
   */
  async getUserProfile(userId: string): Promise<LineUserProfile> {
    const response = await fetch(`${LINE_API_BASE_URL}/profile/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get user profile: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * 向特定用戶推送訊息
   * @param userId LINE 用戶 ID
   * @param message 要發送的訊息
   */
  async pushNotification(userId: string, message: string): Promise<void> {
    const requestBody: PushMessageRequest = {
      to: userId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    };

    const response = await fetch(`${LINE_API_BASE_URL}/message/push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to push notification: ${response.status} - ${errorText}`);
    }
  }

  /**
   * 批量推送訊息給多個用戶
   * @param userIds LINE 用戶 ID 陣列
   * @param message 要發送的訊息
   * @returns 成功和失敗的統計
   */
  async batchPushNotifications(
    userIds: string[], 
    message: string
  ): Promise<{ success: number; failed: number; errors: Array<{ userId: string; error: string }> }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    // 並行發送，但限制同時發送數量避免 rate limiting
    const BATCH_SIZE = 10;
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (userId) => {
        try {
          await this.pushNotification(userId, message);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      await Promise.all(promises);
    }

    return results;
  }
}

// 單例模式，避免重複建立實例
let lineApiClient: LineApiClient | null = null;

export function getLineApiClient(): LineApiClient {
  if (!lineApiClient) {
    lineApiClient = new LineApiClient();
  }
  return lineApiClient;
}

export type { LineUserProfile, PushMessageRequest };