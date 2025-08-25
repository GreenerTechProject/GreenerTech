#include <Wire.h>
#include "DHT.h"
#include "MPU6050.h"

// === DHT11 ===
#define DHTPIN 2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// === MQ135 ===
#define MQ135_PIN A0

// === MH Sensor (LDR) ===
#define MH_SENSOR_PIN A1   // Lumière

// === MPU6050 ===
MPU6050 mpu;

void setup() {
  Serial.begin(9600);
  Serial.println("=== DEMARRAGE ARDUINO SERRE ===");

  // --- Init DHT ---
  Serial.println("Init DHT...");
  dht.begin();
  Serial.println("DHT OK");

  // --- Init I2C ---
  Serial.println("Init I2C...");
  Wire.begin();
  Serial.println("I2C OK");

  // --- Init MPU ---
  Serial.println("Init MPU...");
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("MPU6050 OK");
  } else {
    Serial.println("ERREUR: MPU6050 NON DETECTE !");
  }

  // --- Test MH Sensor (LDR) ---
  int testMH = analogRead(MH_SENSOR_PIN);
  if (testMH >= 0 && testMH <= 1023) {
    Serial.print("MH Sensor (LDR) OK | Valeur initiale: ");
    Serial.println(testMH);
  } else {
    Serial.println("ERREUR: MH Sensor NON DETECTE !");
  }

  Serial.println("--------------------------");
  Serial.println();
}

void loop() {
  Serial.println("------ Nouvelle mesure ------");

  // === DHT11 ===
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    Serial.print("🌡 Température: ");
    Serial.print(t);
    Serial.print(" °C | 💧 Humidité: ");
    Serial.print(h);
    Serial.println(" %");
  } else {
    Serial.println("Erreur lecture DHT11 !");
  }

  // === MQ135 ===
  int mqValue = analogRead(MQ135_PIN);
  Serial.print("MQ135 (Qualité air): ");
  Serial.print(mqValue);
  if (mqValue < 200) {
    Serial.println(" | Etat: Air propre ");
  } else if (mqValue < 400) {
    Serial.println(" | Etat: Qualité moyenne ");
  } else {
    Serial.println(" | Etat: Pollution détectée ");
  }

  // === MH Sensor (LDR) ===
  int mhValue = analogRead(MH_SENSOR_PIN);
  Serial.print("Lumière (MH Sensor): ");
  Serial.print(mhValue);
  if (mhValue < 100) {
    Serial.println(" | Etat: Faible ");
  } else if (mhValue < 500) {
    Serial.println(" | Etat: Moyenne ");
  } else {
    Serial.println(" | Etat: Forte ");
  }

  // === MPU6050 ===
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  Serial.print("Accel: ");
  Serial.print(ax); Serial.print(", ");
  Serial.print(ay); Serial.print(", ");
  Serial.println(az);
  Serial.print("Gyro: ");
  Serial.print(gx); Serial.print(", ");
  Serial.print(gy); Serial.print(", ");
  Serial.println(gz);

  Serial.println("--------------------------");
  Serial.println();

  delay(2000); // pause 2 sec pour lisibilité
}
