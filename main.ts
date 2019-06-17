// - - - - - - - - - - - - - - -
// - M - - - - - - - - - - - - -
// - - M - - - - - - - - - - - -
// - - - M - - - - - - - - - - -
// - - - - M - - - - - - - - - -
// - - - M - - - - - - - - - - -
// - - M - - - - - - - - - - - -
// - M - - - - - A A A X X X - -
// - - - - - - - - - - - - - - -

// import '../core/output';
// import '../color-sensor/color';
// import '../base/shims';

interface electronicSettings {
  rightMotor: motors.Motor;
  leftMotor: motors.Motor;
  rightSensor: sensors.ColorSensor;
  leftSensor: sensors.ColorSensor;
  alfaSensor?: sensors.ColorSensor;
  betaSensor?: sensors.ColorSensor;
  speed: number;
}

interface constructionSettings {
  wheelDiameter: number;
  distanceBeetwenWheels: number;
  distanceBeetwenBaseAndSensors: number;
}

interface errorSettings {
  kRightWheel: number;
  kLeftWheel: number;
  kRightSensor: number;
  kLeftSensor: number;
  kAlfaSensor?: number;
  kBetaSensor?: number;
}

interface lineSettings {
  kP: number;
  kI: number;
  kD: number;
  black: number;
  white: number;
}

interface RobotSettings {
  electronic: electronicSettings;
  construction: constructionSettings;
  error: errorSettings;
  line: lineSettings;
}

enum Side {
  Left,
  Right,
  Alfa,
  Beta
}

class Robot {
  settings: RobotSettings;
  constructor(settings: RobotSettings) {
    this.settings = settings;
    let lM = this.settings.electronic.leftMotor;
    lM.stop();
    lM.reset();
    lM.setPauseOnRun(false);
    lM.setBrake(true)
    let rM = this.settings.electronic.leftMotor;
    rM.stop();
    rM.reset();
    rM.setPauseOnRun(false);
    rM.setBrake(true)

    this.readDataFromSensor(Side.Left);
    this.readDataFromSensor(Side.Right);
  }

  pause(until: () => boolean) {
    while (!until()) {}
  }

  getSensor(side: Side): sensors.ColorSensor {
    if (side == Side.Left) return this.settings.electronic.leftSensor;
    if (side == Side.Right) return this.settings.electronic.rightSensor;
    if (side == Side.Alfa) return this.settings.electronic.alfaSensor;
    if (side == Side.Beta) return this.settings.electronic.betaSensor;
  }

  getSensorK(side: Side): number {
    if (side == Side.Left) return this.settings.error.kLeftSensor;
    if (side == Side.Right) return this.settings.error.kRightSensor;
    if (side == Side.Alfa) return this.settings.error.kAlfaSensor;
    if (side == Side.Beta) return this.settings.error.kBetaSensor;
  }

  getMotor(side: Side): motors.Motor {
    if (side == Side.Left) return this.settings.electronic.leftMotor;
    if (side == Side.Right) return this.settings.electronic.rightMotor;
  }

  getMotorK(side: Side): number {
    if (side == Side.Left) return this.settings.error.kLeftWheel;
    if (side == Side.Right) return this.settings.error.kRightWheel;
  }

  readDataFromSensor(side: Side): number {
    return this.getSensor(side).reflectedLight() * this.getSensorK(side);
  }

  readTacho(side: Side): number {
    return this.getMotor(side).angle() / this.getMotorK(side);
  }

  runMotor(side: Side, speed: number) {
    this.getMotor(side).run(speed * this.getMotorK(side));
  }

  stopMotor(side: Side) {
    this.getMotor(side).stop();
  }

  moveWheel(
    side: Side,
    speed: number,
    until: () => boolean = () => false,
    stop: boolean = true
  ) {
    this.runMotor(side, speed);
    this.pause(until);
    if (stop) this.stopMotor(side);
  }

  moveWheels(
    speedLeft: number,
    speedRight: number,
    until: () => boolean = () => false,
    stop: boolean = true
  ) {
    this.runMotor(Side.Left, speedLeft);
    this.runMotor(Side.Right, speedRight);
    this.pause(until);
    if (stop) this.stopMotor(Side.Left);
    if (stop) this.stopMotor(Side.Right);
  }

  moveAhead(until: () => boolean = () => false, stop: boolean = true) {
    this.moveWheels(
      this.settings.electronic.speed,
      this.settings.electronic.speed,
      until,
      stop
    );
  }

  untilTime(time: number): () => boolean {
    let startTime = control.millis();
    return () => {
      return control.millis() - startTime > time;
    };
  }
  untilBlack(side: Side) {
    return () => {
      return this.readDataFromSensor(side) < this.settings.line.black;
    };
  }

  untilCm(side: Side, cm: number): () => boolean {
    let k = this.settings.construction.wheelDiameter * Math.PI;
    let startPos = this.readTacho(side);
    return () => {
      return this.readTacho(side) - startPos > (cm / k) * 360;
    };
  }

  untilDegrees(side: Side, dgr: number): () => boolean {
    let startPos = this.readTacho(side);
    return () => {
      return this.readTacho(side) - startPos > dgr;
    };
  }
}
