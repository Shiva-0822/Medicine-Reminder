# Medicine Reminder App

A React Native application that helps users manage their medications with reminders, progress tracking, refill alerts, and dose history.

## 📱 Features

### **1. Add Medications**

* Enter medicine name, dosage, timings, duration, and start date.
* Enable/disable reminders.

### **2. Smart Reminders**

* Uses Expo Notifications for scheduled alerts.
* Notifies users at the exact time medicines need to be taken.

### **3. Refill Tracker**

* Tracks the current supply of tablets.
* Example: If you started with **10 tablets** and **2 are remaining**, the app alerts you to refill.
* When the tablet count hits zero, the app notifies that the stock is empty.

### **4. Progress Tracking**

* Shows how many doses are completed and how many are left.
* Allows users to visually track their medication completion.
* Helps maintain discipline and consistency.

### **5. Dose History**

* Displays all past doses.
* Useful for checking missed or taken doses.

### **6. Secure Local Storage**

* Uses `AsyncStorage` to save medications and dose history.
* Works fully offline.

````

* **React Native**
* **Expo** (Notifications, Router)
* **AsyncStorage** for persistent storage

---

## ▶️ Getting Started

### **1. Install dependencies**

```
npm install
```

### **2. Start the app**

```
npx expo start
```

