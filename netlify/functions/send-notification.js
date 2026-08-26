import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'al-ahad-app-2026';

  if (privateKey && clientEmail) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized with service account.');
  } else {
    // Fallback to Application Default Credentials (ADC) for local development
    admin.initializeApp({
      projectId,
    });
    console.log('Firebase Admin initialized with Application Default Credentials.');
  }
}

const db = admin.firestore();

// Derive user role (admin/employee)
function deriveUserRole(member) {
  if (!member) return null;
  const role = (member.role || '').toLowerCase();
  
  if (
    member.id === 1 || 
    member.isSupervisor || 
    member.uid === 'exGmtjCKN9ZKa3HvmoGxiCZH3O63' || // Admin UID
    role.includes('مدير') || 
    role.includes('مشرف')
  ) {
    return 'admin';
  }
  return 'employee';
}

// Get all supervisor team IDs
async function getSupervisors() {
  const teamSnap = await db.collection('team').get();
  const supervisorIds = [];
  
  teamSnap.forEach(doc => {
    const data = doc.data();
    const role = (data.role || '').toLowerCase();
    
    if (
      data.id === 1 || 
      data.isSupervisor || 
      data.uid === 'exGmtjCKN9ZKa3HvmoGxiCZH3O63' || // Admin UID
      role.includes('مدير') || 
      role.includes('مشرف')
    ) {
      supervisorIds.push(Number(data.id));
    }
  });
  return supervisorIds;
}

// Fetch all active FCM push tokens for target user IDs
async function getTargetTokens(teamMemberIds) {
  const tokens = [];
  const querySnapshot = await db.collection('devices')
    .where('enabled', '==', true)
    .get();

  querySnapshot.forEach(docSnapshot => {
    const data = docSnapshot.data();
    const tId = Number(data.teamMemberId);
    if (teamMemberIds.includes(tId) && data.pushToken) {
      tokens.push(data.pushToken);
    }
  });

  return [...new Set(tokens)]; // Unique tokens list
}

// Clean up expired or unregistered FCM tokens
async function cleanupTokens(badTokens) {
  if (!badTokens || badTokens.length === 0) return;
  console.log(`Cleaning up ${badTokens.length} stale/invalid registration tokens...`);
  
  const querySnapshot = await db.collection('devices')
    .where('enabled', '==', true)
    .get();
    
  const batch = db.batch();
  let count = 0;
  
  querySnapshot.forEach(docSnapshot => {
    const data = docSnapshot.data();
    if (badTokens.includes(data.pushToken)) {
      batch.update(docSnapshot.ref, { enabled: false, updatedAt: new Date().toISOString() });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Successfully disabled ${count} devices in Firestore.`);
  }
}

export async function handler(event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS OPTIONS pre-flight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Successful preflight' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { eventId, eventType, payload, actor } = JSON.parse(event.body);

    if (!eventId || !eventType || !payload) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters: eventId, eventType, payload' })
      };
    }

    console.log(`Processing event: ${eventId} (Type: ${eventType})`);

    // 1. Idempotency Check: Prevent duplicate notifications for the same eventId
    const eventRef = db.collection('processedEvents').doc(String(eventId));
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      console.log(`Duplicate event detected. Skipped: ${eventId}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Event already processed' })
      };
    }

    // Register event immediately to reserve it
    await eventRef.set({
      eventType,
      actor: actor || null,
      createdAt: new Date().toISOString()
    });

    // 2. Determine target notification tokens based on business logic permissions
    let targetTokens = [];
    let title = 'منظومة العهد';
    let body = '';
    let clickUrl = '/';

    const actorRole = deriveUserRole(actor);
    const actorId = actor ? Number(actor.id) : null;

    if (eventType === 'test') {
      // Test event: target a specific token directly
      const token = payload.token;
      if (token) {
        targetTokens = [token];
        title = '🔔 إشعار تجريبي';
        body = 'تهانينا! نظام الإشعارات الأصلي يعمل بنجاح على هذا الجهاز.';
        clickUrl = '/#/settings';
      }
    } else if (eventType === 'booking_created') {
      const bookingId = payload.id;
      const isSuper = actorRole === 'admin';
      const actorName = actor?.name || 'أحد أعضاء الفريق';

      if (isSuper) {
        // Admin created it -> notify assigned team members (excluding admin)
        const teamAssigned = (payload.teamAssigned || []).map(Number).filter(id => id !== actorId);
        if (teamAssigned.length > 0) {
          targetTokens = await getTargetTokens(teamAssigned);
        }
        title = '📅 حجز جديد';
        body = 'تمت إضافة حجز جديد بواسطة المشرف.';
        clickUrl = `/#/employee/dashboard?entityType=booking&entityId=${bookingId}`;
      } else {
        // Employee created it -> notify all supervisors
        const supervisors = await getSupervisors();
        const targetSupervisors = supervisors.filter(id => id !== actorId);
        if (targetSupervisors.length > 0) {
          targetTokens = await getTargetTokens(targetSupervisors);
        }
        title = '📅 حجز جديد';
        body = `تمت إضافة حجز جديد بواسطة ${actorName}.`;
        clickUrl = `/#/admin/dashboard?entityType=booking&entityId=${bookingId}`;
      }
    } else if (eventType === 'booking_updated') {
      const bookingId = payload.id;
      const clientName = payload.clientName || 'غير محدد';
      const teamAssigned = (payload.teamAssigned || []).map(Number);
      
      // Notify all supervisors + assigned team members (excluding actor)
      const supervisors = await getSupervisors();
      const unionTargets = [...new Set([...supervisors, ...teamAssigned])]
        .filter(id => id !== actorId);

      if (unionTargets.length > 0) {
        targetTokens = await getTargetTokens(unionTargets);
      }
      
      title = '🔄 تحديث حجز مهم';
      body = `تم تعديل حجز العميل: ${clientName}.`;
      clickUrl = actorRole === 'admin' 
        ? `/#/admin/dashboard?entityType=booking&entityId=${bookingId}` 
        : `/#/employee/dashboard?entityType=booking&entityId=${bookingId}`;

    } else if (eventType === 'booking_cancelled') {
      const clientName = payload.clientName || 'غير محدد';
      const bookingTitle = payload.title || 'حجز تصوير';
      const teamAssigned = (payload.teamAssigned || []).map(Number);
      
      const supervisors = await getSupervisors();
      const unionTargets = [...new Set([...supervisors, ...teamAssigned])]
        .filter(id => id !== actorId);

      if (unionTargets.length > 0) {
        targetTokens = await getTargetTokens(unionTargets);
      }
      
      title = '❌ إلغاء حجز';
      body = `تم إلغاء حجز العميل: ${clientName} - (${bookingTitle}).`;
      clickUrl = '/';

    } else if (eventType === 'booking_deleted') {
      const clientName = payload.clientName || 'غير محدد';
      const bookingTitle = payload.title || 'حجز تصوير';
      const teamAssigned = (payload.teamAssigned || []).map(Number);
      
      const supervisors = await getSupervisors();
      const unionTargets = [...new Set([...supervisors, ...teamAssigned])]
        .filter(id => id !== actorId);

      if (unionTargets.length > 0) {
        targetTokens = await getTargetTokens(unionTargets);
      }
      
      title = '🗑️ حذف حجز';
      body = `تم حذف حجز العميل: ${clientName} - (${bookingTitle}) من النظام بالكامل.`;
      clickUrl = '/';

    } else if (eventType === 'client_created') {
      const isSuper = actorRole === 'admin';
      const actorName = actor?.name || 'أحد أعضاء الفريق';

      if (isSuper) {
        // Admin created client -> notify all active team members (excluding actor)
        const teamSnap = await db.collection('team').get();
        const allTeamIds = [];
        teamSnap.forEach(doc => {
          const tId = Number(doc.data().id);
          if (tId && tId !== actorId) allTeamIds.push(tId);
        });

        if (allTeamIds.length > 0) {
          targetTokens = await getTargetTokens(allTeamIds);
        }
        title = '👥 عميل جديد';
        body = 'تم إضافة عميل جديد بواسطة المشرف.';
        clickUrl = `/#/employee/dashboard`;
      } else {
        // Employee created client -> notify all supervisors
        const supervisors = await getSupervisors();
        const targetSupervisors = supervisors.filter(id => id !== actorId);
        if (targetSupervisors.length > 0) {
          targetTokens = await getTargetTokens(targetSupervisors);
        }
        title = '👥 عميل جديد';
        body = `تمت إضافة عميل جديد بواسطة ${actorName}.`;
        clickUrl = `/#/admin/dashboard`;
      }
    }

    if (targetTokens.length === 0) {
      console.log('No active device tokens found for target recipients. Event process completed.');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'No devices to notify' })
      };
    }

    console.log(`Sending multicast push to ${targetTokens.length} devices...`);

    // 3. Build and send multicast push notification payload
    const multicastMessage = {
      notification: {
        title,
        body
      },
      data: {
        click_action: clickUrl,
        eventId: String(eventId),
        eventType: String(eventType)
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          click_action: clickUrl
        }
      },
      tokens: targetTokens
    };

    const response = await admin.messaging().sendEachForMulticast(multicastMessage);
    console.log(`FCM response: ${response.successCount} sent, ${response.failureCount} failed.`);

    // 4. Handle invalid/expired tokens and clean them up
    if (response.failureCount > 0) {
      const badTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          // Stale tokens to clean up
          if (
            errorCode === 'messaging/registration-token-not-registered' || 
            errorCode === 'messaging/invalid-registration-token'
          ) {
            badTokens.push(targetTokens[idx]);
          }
          console.warn(`Device token failed: ${targetTokens[idx]} - Error: ${errorCode}`);
        }
      });
      
      if (badTokens.length > 0) {
        await cleanupTokens(badTokens);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sentCount: response.successCount,
        failureCount: response.failureCount
      })
    };

  } catch (error) {
    console.error('Error handling push notification:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
}
