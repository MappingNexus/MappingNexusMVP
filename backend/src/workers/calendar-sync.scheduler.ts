import cron from 'node-cron';
import { env } from '../config/env.js';
import { syncAllConnectedCalendars } from '../services/calendar-sync.service.js';

let started = false;

export function startCalendarSyncScheduler() {
    if (started) return;
    started = true;

    cron.schedule(
        env.CALENDAR_SYNC_CRON,
        async () => {
            try {
                const result = await syncAllConnectedCalendars(30);
                console.log(
                    `[calendar-sync] completed: employees=${result.employeesScanned}, synced=${result.synced}, failed=${result.failed}`
                );
            } catch (error: any) {
                console.error('[calendar-sync] nightly job failed:', error.message);
            }
        },
        { timezone: env.CALENDAR_SYNC_TIMEZONE }
    );

    console.log(`[calendar-sync] scheduled with cron "${env.CALENDAR_SYNC_CRON}" (${env.CALENDAR_SYNC_TIMEZONE})`);
}
