import readingsJson from "@/data/minutes/readings.json";
import { members } from "@/data/members";
import { meetingsForMember, type MemberMeeting, type ReadingsFile } from "@/lib/minutes/record";

const readings = readingsJson as ReadingsFile;

export const minutesSyncedAt = readings.syncedAt;
export const minutesNote = readings.note;
export const minuteMeetings = readings.meetings;

export function memberMinutes(slug: string): MemberMeeting[] {
  return meetingsForMember(readings, slug, members);
}

export function minutesSummary() {
  let read = 0;
  let unread = 0;
  let unreadableFiles = 0;
  let closedSessions = 0;
  for (const meeting of readings.meetings) {
    if (meeting.status !== "read") unreadableFiles += 1;
    if (meeting.closedSessionOmitted) closedSessions += 1;
    for (const division of meeting.divisions) {
      if (division.read) read += 1;
      else unread += 1;
    }
  }
  return {
    syncedAt: readings.syncedAt,
    files: readings.meetings.length,
    unreadableFiles,
    closedSessions,
    read,
    unread,
  };
}
