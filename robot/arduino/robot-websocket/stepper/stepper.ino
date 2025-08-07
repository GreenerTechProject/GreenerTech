#include <AccelStepper.h>

AccelStepper motor1(AccelStepper::DRIVER, 2, 5);
AccelStepper motor2(AccelStepper::DRIVER, 3, 6);
//AccelStepper motor3(AccelStepper::DRIVER, 8, 9);
//AccelStepper motor4(AccelStepper::DRIVER, 10, 11);

String input = "";
float speed1 = 0;
float speed2 = 0;
float speed3 = 0;
float speed4 = 0;

void setup() {
  Serial.begin(9600);
  motor1.setMaxSpeed(1000);
  motor2.setMaxSpeed(1000);
  //motor3.setMaxSpeed(1000);
  //motor4.setMaxSpeed(1000);
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      processCommand(input);
      input = "";
    } else {
      input += c;
    }
  }

  motor1.setSpeed(speed1);
  motor1.runSpeed();

  motor2.setSpeed(speed2);
  motor2.runSpeed();
}

void processCommand(String command) {
  command.trim();

  if (command == "TOP") {
    speed1 = 500000;
  }  else if (command == "DOWN") {
    speed1 = -500000;
  } else if (command == "RIGHT") {
    speed2 = -500000;
  } else if (command == "LEFT") {
    speed2 = 500000;
	
  } else if (command == "RIGHTCAM1") {
    speed3 = -500000;
  } else if (command == "LEFTCAM1") {
    speed3 = 500000;
	
  } else if (command == "RIGHTCAM2") {
    speed4 = -500000;
  } else if (command == "LEFTCAM2") {
    speed4 = 500000;
	
  } else if (command == "STOP") {
    speed1 = 0;
    speed2 = 0;
    speed3 = 0;
    speed4 = 0;
  }
}
