import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Medication } from "./storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permissions not granted");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
        lightColor: "#1a8e2d",
      });
    }

    // Return a dummy token for local notifications
    // We don't need an actual push token for local notifications
    return "local-notifications-enabled";
  } catch (error) {
    console.error("Error setting up notifications:", error);
    return null;
  }
}

export async function scheduleMedicationReminder(
  medication: any
): Promise<void> {
  if (!medication.reminderEnabled) return;

  try {
    // Schedule notifications for each time
    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);

      // If time has passed for today, schedule for tomorrow
      if (today < new Date()) {
        today.setDate(today.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medication Reminder",
          body: `Time to take ${medication.name} (${medication.dosage})`,
          sound: "default",
          data: { medicationId: medication.id },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        } as Notifications.NotificationTriggerInput,
      });
    }
  } catch (error) {
    console.error("Error scheduling medication reminder:", error);
  }
}

export async function scheduleRefillReminder(
  medication: any
): Promise<void> {
  if (!medication.refillReminder) return;

  try {
    // Schedule a daily notification to check supply levels
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Refill Check",
        body: `Checking refill status for ${medication.name}`,
        sound: "default",
        data: { medicationId: medication.id, type: "refill-check" },
      },
      trigger: {
        repeats: true,
        hour: 9, // Check at 9 AM daily
        minute: 0,
      } as Notifications.NotificationTriggerInput,
    });
  } catch (error) {
    console.error("Error scheduling refill reminder:", error);
  }
}

export async function cancelMedicationReminders(
  medicationId: string
): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        medicationId?: string;
      } | null;
      if (data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error("Error canceling medication reminders:", error);
  }
}

export async function updateMedicationReminders(
  medication: Medication
): Promise<void> {
  try {
    // Cancel existing reminders
    await cancelMedicationReminders(medication.id);

    // Schedule new reminders
    await scheduleMedicationReminder(medication);
    await scheduleRefillReminder(medication);
  } catch (error) {
    console.error("Error updating medication reminders:", error);
  }
}
