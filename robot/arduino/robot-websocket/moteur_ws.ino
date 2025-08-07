#include <AccelStepper.h>

#define DIR1 4
#define STEP1 5
#define DIR2 6
#define STEP2 7

AccelStepper motor1(AccelStepper::DRIVER, STEP1, DIR1);
AccelStepper motor2(AccelStepper::DRIVER, STEP2, DIR2);

String command = "";

void setup() {
  Serial.begin(9600);
  motor1.setMaxSpeed(800);
  motor1.setAcceleration(400);
  motor2.setMaxSpeed(800);
  motor2.setAcceleration(400);
}

void loop() {
  if (Serial.available()) {
    command = Serial.readStringUntil('\n');
    command.trim();
  }

  if (command == "LEFT") {
    motor1.setSpeed(-400);
    motor1.runSpeed();
  }
  else if (command == "RIGHT") {
    motor1.setSpeed(400);
    motor1.runSpeed();
  }
  else if (command == "UP") {
    motor2.setSpeed(400);
    motor2.runSpeed();
  }
  else if (command == "DOWN") {
    motor2.setSpeed(-400);
    motor2.runSpeed();
  }
  else {
    motor1.setSpeed(0);
    motor2.setSpeed(0);
  }
}

