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
    console.log('Firebase Admin initialized for Scheduled Reminders.');
  } else {
    admin.initializeApp({
      projectId,
    });
    console.log('Firebase Admin initialized with ADC for Scheduled Reminders.');
  }
}

const db = admin.firestore();

// Fetch all active FCM push tokens for target user IDs
async function getTargetTokens(teamMemberIds) {
  if (!teamMemberIds || teamMemberIds.length === 0) return [];
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

  return [...new Set(tokens)];
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

// Netlify Scheduled Function Handler
export async function handler(event, context) {
  console.log('Scheduled daily-reminders job started execution.');
  
  try {
    // 1. Get current Riyadh time parameters
    const nowRiyadh = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
    const currentHour = nowRiyadh.getHours();
    
    // Riyadh ISO dates
    const getRiyadhDateStr = (offsetDays = 0) => {
      const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
      if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
      return d.toISOString().substring(0, 10);
    };
    
    const todayStr = getRiyadhDateStr(0);
    const tomorrowStr = getRiyadhDateStr(1);
    
    console.log(`Current Riyadh Time: ${nowRiyadh.toISOString()} (Hour: ${currentHour}), Today: ${todayStr}, Tomorrow: ${tomorrowStr}`);

    // --- TASK A: TOMORROW SUMMARY NOTIFICATION (Runs at 8:00 PM Riyadh time / hour === 20) ---
    if (currentHour === 20) {
      console.log('Processing tomorrow schedule summary notifications...');
      
      // Fetch tomorrow's active bookings
      const bookingsSnap = await db.collection('bookings')
        .where('date', '==', tomorrowStr)
        .get();
        
      const tomorrowBookings = [];
      bookingsSnap.forEach(doc => {
        const b = doc.data();
        if (b.status !== 'ملغي') {
          tomorrowBookings.push({ id: doc.id, ...b });
        }
      });
      
      if (tomorrowBookings.length > 0) {
        console.log(`Found ${tomorrowBookings.length} bookings for tomorrow.`);
        
        // 1. Notify supervisors with total count
        const supervisors = await getSupervisors();
        const supervisorTokens = await getTargetTokens(supervisors);
        
        if (supervisorTokens.length > 0) {
          const message = {
            notification: {
              title: '📅 جدول الغد اليومي',
              body: `لدى المؤسسة غداً عدد (${tomorrowBookings.length}) حجوزات تصوير مجدولة. يرجى المتابعة.`
            },
            data: { click_action: '/#/admin/dashboard' },
            tokens: supervisorTokens
          };
          await admin.messaging().sendEachForMulticast(message);
          console.log('Sent tomorrow summary to supervisors.');
        }
        
        // 2. Notify each employee of their assigned bookings
        const teamSnap = await db.collection('team').get();
        const teamMembers = [];
        teamSnap.forEach(doc => teamMembers.push(doc.data()));
        
        for (const member of teamMembers) {
          const memberId = Number(member.id);
          const memberBookings = tomorrowBookings.filter(b => 
            (b.teamAssigned || []).map(Number).includes(memberId)
          );
          
          if (memberBookings.length > 0) {
            const memberTokens = await getTargetTokens([memberId]);
            if (memberTokens.length > 0) {
              const bTitles = memberBookings.map(b => b.title).join(', ');
              const message = {
                notification: {
                  title: '📅 حجوزاتك ليوم غد',
                  body: `لديك غداً (${memberBookings.length}) حجوزات مكلف بها: [${bTitles}]. بالتوفيق!`
                },
                data: { click_action: '/#/employee/dashboard' },
                tokens: memberTokens
              };
              await admin.messaging().sendEachForMulticast(message);
              console.log(`Sent tomorrow summary to team member ID: ${memberId}`);
            }
          }
        }
      } else {
        console.log('No bookings scheduled for tomorrow.');
      }
    }

    // --- TASK B: 2-HOUR PRE-BOOKING ALERTS (Runs every hour for bookings today/tomorrow) ---
    console.log('Processing 2-hour pre-booking alerts...');
    
    // Fetch bookings for today & tomorrow
    const todayTomorrowSnap = await db.collection('bookings')
      .where('date', 'in', [todayStr, tomorrowStr])
      .get();
      
    const activeBookings = [];
    todayTomorrowSnap.forEach(doc => {
      const b = doc.data();
      if (b.status !== 'ملغي' && !b.twoHourReminderSent) {
        activeBookings.push({ id: doc.id, ref: doc.ref, ...b });
      }
    });
    
    const nowMs = nowRiyadh.getTime();
    
    for (const b of activeBookings) {
      if (!b.startTime) continue;
      
      // Parse booking date & startTime (HH:MM) to absolute Riyadh date
      const [hourStr, minStr] = b.startTime.split(':');
      const bookingDateParts = b.date.split('-'); // YYYY-MM-DD
      
      const bookingRiyadhTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
      bookingRiyadhTime.setFullYear(Number(bookingDateParts[0]), Number(bookingDateParts[1]) - 1, Number(bookingDateParts[2]));
      bookingRiyadhTime.setHours(Number(hourStr), Number(minStr), 0, 0);
      
      const diffMs = bookingRiyadhTime.getTime() - nowMs;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      console.log(`Checking booking: "${b.title}" starts at ${b.date} ${b.startTime}. Difference is ${diffHours.toFixed(2)} hours.`);
      
      // Trigger if booking starts in approx 1.5 to 2.5 hours (centered around 2 hours)
      if (diffHours > 1.2 && diffHours <= 2.2) {
        console.log(`Triggering 2-hour alert for booking: "${b.title}"`);
        
        const teamAssigned = (b.teamAssigned || []).map(Number);
        if (teamAssigned.length > 0) {
          const targetTokens = await getTargetTokens(teamAssigned);
          
          if (targetTokens.length > 0) {
            const message = {
              notification: {
                title: '⏰ تذكير: بدء جلسة تصوير',
                body: `تذكير: حجزك [ ${b.title} ] يبدأ بعد ساعتين (الساعة ${b.startTime}). بالتوفيق!`
              },
              data: {
                click_action: `/#/employee/dashboard?entityType=booking&entityId=${b.id}`
              },
              tokens: targetTokens
            };
            
            await admin.messaging().sendEachForMulticast(message);
            console.log(`Sent 2-hour pre-booking notification to tokens of team: ${teamAssigned.join(',')}`);
          }
        }
        
        // Mark as sent in Firestore so we don't notify again next hour
        await b.ref.update({ twoHourReminderSent: true });
        console.log(`Marked booking ID ${b.id} with twoHourReminderSent: true.`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Scheduled tasks processed successfully' })
    };
  } catch (error) {
    console.error('Error executing scheduled reminders:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
}

// Scheduled configuration metadata for Netlify
export const config = {
  schedule: "0 * * * *" // Runs at the start of every hour
};
