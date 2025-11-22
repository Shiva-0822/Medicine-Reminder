import AsyncStorage from "@react-native-async-storage/async-storage";

const MEDICATIONS_KEY = "@medications";
const DOSE_HISTORY_KEY = "@dose_history";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  startDate: string;
  duration: string;
  color: string;
  reminderEnabled: boolean;
  currentSupply: number;
  totalSupply: number;
  refillAt: number;
  refillReminder: boolean;
  lastRefillDate?: string;
}

export interface DoseHistory {
  id: string;
  medicationId: string;
  timestamp: string;
  taken: boolean;
}

export async function getMedications(): Promise<Medication[]> {
  try {
    const data = await AsyncStorage.getItem(MEDICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting medications:", error);
    return [];
  }
}

export async function addMedication(medication: Medication): Promise<void> {
  try {
    const medications = await getMedications();
    medications.push(medication);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error("Error adding medication:", error);
    throw error;
  }
}

export async function updateMedication(
  updatedMedication: Medication
): Promise<void> {
  try {
    const medications = await getMedications();
    const index = medications.findIndex(
      (med) => med.id === updatedMedication.id
    );
    if (index !== -1) {
      medications[index] = updatedMedication;
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
    }
  } catch (error) {
    console.error("Error updating medication:", error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const medications = await getMedications();
    const updatedMedications = medications.filter((med) => med.id !== id);
    await AsyncStorage.setItem(
      MEDICATIONS_KEY,
      JSON.stringify(updatedMedications)
    );
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
}

export async function getDoseHistory(): Promise<DoseHistory[]> {
  try {
    const data = await AsyncStorage.getItem(DOSE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting dose history:", error);
    return [];
  }
}

export async function getTodaysDoses(): Promise<DoseHistory[]> {
  try {
    const history = await getDoseHistory();
    const today = new Date().toDateString();
    return history.filter(
      (dose) => new Date(dose.timestamp).toDateString() === today
    );
  } catch (error) {
    console.error("Error getting today's doses:", error);
    return [];
  }
}

export async function recordDose(
  medicationId: string,
  taken: boolean,
  timestamp: string
): Promise<void> {
  try {
    const history = await getDoseHistory();
    
    // Check if dose already recorded for this medication at this specific time
    const doseTime = new Date(timestamp);
    const existingDose = history.find(
      (dose) => 
        dose.medicationId === medicationId && 
        new Date(dose.timestamp).toDateString() === doseTime.toDateString() &&
        new Date(dose.timestamp).getHours() === doseTime.getHours() &&
        new Date(dose.timestamp).getMinutes() === doseTime.getMinutes()
    );
    
    if (existingDose) {
      // Update existing dose
      existingDose.taken = taken;
      await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(history));
    } else {
      // Create new dose record
      const newDose: DoseHistory = {
        id: Math.random().toString(36).substr(2, 9),
        medicationId,
        timestamp,
        taken,
      };

      history.push(newDose);
      await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(history));
    }

    // Update medication supply if taken
    if (taken) {
      const medications = await getMedications();
      const medication = medications.find((med) => med.id === medicationId);
      if (medication && medication.currentSupply > 0) {
        medication.currentSupply -= 1;
        await updateMedication(medication);
      }
    }
  } catch (error) {
    console.error("Error recording dose:", error);
    throw error;
  }
}

export async function checkAndRecordMissedDoses(): Promise<void> {
  try {
    const medications = await getMedications();
    const history = await getDoseHistory();
    const now = new Date();
    
    for (const medication of medications) {
      const startDate = new Date(medication.startDate);
      const durationDays = parseInt(medication.duration.split(" ")[0]);
      
      // Check if medication is active
      if (durationDays !== -1) {
        const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        if (now > endDate) continue;
      }
      
      // Check each scheduled time
      for (const time of medication.times) {
        let hours, minutes;
        
        // Handle 12-hour format with AM/PM
        if (time.includes("AM") || time.includes("PM")) {
          const [timePart, period] = time.split(" ");
          [hours, minutes] = timePart.split(":").map(Number);
          
          // Convert to 24-hour format
          if (period === "PM" && hours !== 12) {
            hours += 12;
          } else if (period === "AM" && hours === 12) {
            hours = 0;
          }
        } else {
          // Fallback to 24-hour format
          [hours, minutes] = time.split(":").map(Number);
        }
        
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // Add 2-minute grace period
        const graceTime = new Date(scheduledTime.getTime() + 2 * 60 * 1000);
        
        // Only check if grace period has passed
        if (graceTime < now) {
          // Check if dose was already recorded for this medication and specific time today
          const todayString = now.toDateString();
          const existingDose = history.find(
            (dose) => 
              dose.medicationId === medication.id &&
              new Date(dose.timestamp).toDateString() === todayString &&
              new Date(dose.timestamp).getHours() === hours &&
              new Date(dose.timestamp).getMinutes() === minutes
          );
          
          // If no dose recorded and grace period has passed, record as missed
          if (!existingDose) {
            await recordDose(medication.id, false, scheduledTime.toISOString());
          }
        }
      }
    }
  } catch (error) {
    console.error("Error checking missed doses:", error);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([MEDICATIONS_KEY, DOSE_HISTORY_KEY]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}
