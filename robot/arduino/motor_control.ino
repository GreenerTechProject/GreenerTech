#include <AccelStepper.h>

#define DIR_PIN 4
#define STEP_PIN 5
#define MOTOR_INTERFACE_TYPE 1  // Driver STEP/DIR

AccelStepper stepper(MOTOR_INTERFACE_TYPE, STEP_PIN, DIR_PIN);

String command = "";

void setup() {
  Serial.begin(9600);
  stepper.setMaxSpeed(800);
  stepper.setAcceleration(400);
}

void loop() {
  if (Serial.available() > 0) {
    command = Serial.readStringUntil('\n');
    command.trim();
  }

  if (command == "LEFT") {
    stepper.setSpeed(-400);
    stepper.runSpeed();
  }
  else if (command == "RIGHT") {
    stepper.setSpeed(400);
    stepper.runSpeed();
  }
  else {
    stepper.setSpeed(0);
  }
}

