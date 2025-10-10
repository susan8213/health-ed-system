import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getLineBotDatabase } from '@/lib/mongodb';
import { getLineApiClient } from '@/lib/line-api';
import { revalidatePath } from 'next/cache';

/**
 * 同步 LINE Bot 用戶資料到 TCM 診所患者資料庫
 * 
 * 工作流程：
 * 1. 從 linebot DB 取得所有文件中的 userId
 * 2. 使用 LINE Message API 取得用戶個人資料
 * 3. 根據 displayName 與 tcm-clinic patients 進行 name mapping
 * 4. 更新匹配到的患者記錄中的 lineUserId，建立推播能力
 */
export async function POST(request: NextRequest) {
  try {
    // 取得資料庫連接
    const lineBotDb = await getLineBotDatabase();
    const tcmDb = await getDatabase();
    const lineApiClient = getLineApiClient();

    // 步驟 1: 從 linebot DB 撈出所有 userId
    console.log('正在從 linebot DB 取得所有 userId...');
    const lineBotCollection = lineBotDb.collection('patient'); // 假設集合名稱為 messages
    const userIds = await lineBotCollection.distinct('userId');
    
    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有找到需要同步的 LINE 用戶',
        stats: { total: 0, synced: 0, failed: 0 }
      });
    }

    console.log(`找到 ${userIds.length} 個 LINE 用戶 ID`);

    // 步驟 2: 使用 LINE API 取得用戶個人資料
    const userProfiles = [];
    const failedUserIds = [];

    for (const userId of userIds) {
      try {
        const profile = await lineApiClient.getUserProfile(userId);
        userProfiles.push(profile);
        console.log(`取得用戶資料: ${profile.displayName} (${userId})`);
        
        // 避免過快發送請求觸發 rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`無法取得用戶 ${userId} 的資料:`, error);
        failedUserIds.push(userId);
      }
    }

    // 步驟 3 & 4: Name mapping 並更新患者記錄
    const patientsCollection = tcmDb.collection('patients');
    let syncedCount = 0;
    const syncResults = [];

    for (const profile of userProfiles) {
      try {
        // 嘗試根據 displayName 找到匹配的患者，但排除已有 lineUserId 的記錄
        const patient = await patientsCollection.findOne({
          name: { $regex: new RegExp(profile.displayName, 'i') },
          lineUserId: { $exists: false } // 只匹配沒有 lineUserId 的患者
        });

        if (patient) {
          // 更新患者的 lineUserId
          await patientsCollection.updateOne(
            { _id: patient._id },
            { 
              $set: { 
                lineUserId: profile.userId,
                lastSyncedAt: new Date()
              } 
            }
          );
          
          syncedCount++;
          syncResults.push({
            patientId: patient._id,
            patientName: patient.name,
            lineUserId: profile.userId,
            lineDisplayName: profile.displayName,
            status: 'synced'
          });
          
          console.log(`已同步: ${patient.name} ↔ ${profile.displayName}`);
        } else {
          // 檢查是否有同名但已有 lineUserId 的患者
          const existingPatient = await patientsCollection.findOne({
            name: { $regex: new RegExp(profile.displayName, 'i') },
            lineUserId: { $exists: true }
          });
          
          if (existingPatient) {
            syncResults.push({
              lineUserId: profile.userId,
              lineDisplayName: profile.displayName,
              status: 'already_synced',
              existingLineUserId: existingPatient.lineUserId
            });
            console.log(`已跳過（已有 lineUserId）: ${profile.displayName}`);
          } else {
            syncResults.push({
              lineUserId: profile.userId,
              lineDisplayName: profile.displayName,
              status: 'no_match'
            });
            console.log(`無法匹配: ${profile.displayName}`);
          }
        }
      } catch (error) {
        console.error(`同步用戶 ${profile.displayName} 時發生錯誤:`, error);
        syncResults.push({
          lineUserId: profile.userId,
          lineDisplayName: profile.displayName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 清除相關快取
    revalidatePath('/api/users');
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: `LINE推播帳號同步完成! 已同步 ${syncedCount} 位患者`,
      stats: {
        total: userIds.length,
        profilesRetrieved: userProfiles.length,
        profilesFailure: failedUserIds.length,
        synced: syncedCount,
        alreadySynced: syncResults.filter(r => r.status === 'already_synced').length,
        noMatch: syncResults.filter(r => r.status === 'no_match').length,
        errors: syncResults.filter(r => r.status === 'error').length
      },
      results: syncResults,
      failedUserIds
    });

  } catch (error) {
    console.error('LINE推播帳號同步過程中發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'LINE推播帳號同步過程中發生錯誤',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'LINE推播帳號同步 API',
    description: '使用 POST 方法來執行 LINE推播帳號同步操作',
    endpoint: '/api/sync/line-users'
  });
}