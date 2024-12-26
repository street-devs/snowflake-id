declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}

export interface SnowflakeIdOptions {
  customEpoch?: number
  machineId?: { workerId: number; dataCenterId: number }
}

export interface SnowflakeIdDecoded {
  dateTime: Date
  timestamp: bigint
  dataCenterId: bigint
  workerId: bigint
  sequence: bigint
  epoch: number
}

export class SnowflakeId {
  private _lastTimestamp: bigint = 0n
  private _customEpoch: number
  private _sequence: bigint = 0n

  private _workerId: bigint
  private _dataCenterId: bigint

  public readonly DEFAULT_EPOCH_DATETIME = new Date(
    '2024-01-01T00:00:00Z'
  ).getTime()

  /**
   * The total number of bits for a Snowflake ID is typically fixed at 64 bits by design.
   * Modifying totalBits might lead to unexpected behavior or inconsistencies when encoding and decoding Snowflake IDs
   * since the structure of Snowflake IDs is based on this fixed 64-bit structure (with specific bits assigned to timestamp, instance ID, and sequence).
   */
  public readonly ZERO_BITS: number = 1

  public readonly TOTAL_BITS: number = 64

  public readonly EPOCH_BITS: number = 41
  public readonly WORKER_ID_BITS: number = 5
  public readonly DATA_CENTER_ID_BITS: number = 5
  public readonly SEQUENCE_BITS: number = 12

  public readonly MAX_WORKER_ID: number = (1 << this.WORKER_ID_BITS) - 1
  public readonly MAX_DATA_CENTER_ID: number =
    (1 << this.DATA_CENTER_ID_BITS) - 1

  public readonly MAX_SEQUENCE: number = (1 << this.SEQUENCE_BITS) - 1

  public get machineId() {
    return {
      workerId: this._workerId,
      dataCenterId: this._dataCenterId,
    }
  }

  public get customEpoch() {
    return this._customEpoch
  }

  public constructor(opts?: SnowflakeIdOptions) {
    const { workerId: workerIdOpt, dataCenterId: dataCenterIdOpt } =
      opts?.machineId || {}

    this._workerId = BigInt(workerIdOpt ?? random(Number(this.MAX_WORKER_ID)))

    if (this._workerId > this.MAX_WORKER_ID) {
      throw new RangeError(
        `Worker ID must be between 0 and ${this.MAX_WORKER_ID}`
      )
    }

    this._dataCenterId = BigInt(
      dataCenterIdOpt ?? random(Number(this.MAX_DATA_CENTER_ID))
    )

    if (this._dataCenterId > this.MAX_DATA_CENTER_ID) {
      throw new RangeError(
        `Data Center ID must be between 0 and ${this.MAX_DATA_CENTER_ID}`
      )
    }

    this._customEpoch = opts?.customEpoch || this.DEFAULT_EPOCH_DATETIME
  }

  /**
   * Generates a 64-bit unique ID.
   */
  public generate(): bigint {
    const currentTimestamp = BigInt(currentTime(this._customEpoch))

    this._sequence = this.makeSequence(currentTimestamp)

    const timestampBits = currentTimestamp
      .toString(2)
      .padStart(Number(this.EPOCH_BITS), '0')

    const dataCenterBits = this._dataCenterId
      .toString(2)
      .padStart(Number(this.DATA_CENTER_ID_BITS), '0')

    const workerIdBits = this._workerId
      .toString(2)
      .padStart(Number(this.WORKER_ID_BITS), '0')

    const sequenceBits = this._sequence
      .toString(2)
      .padStart(Number(this.SEQUENCE_BITS), '0')

    const id = BigInt(
      `0b${timestampBits}${dataCenterBits}${workerIdBits}${sequenceBits}`
    )

    return id
  }

  public decode(id: bigint): SnowflakeIdDecoded {
    const idBinary = id.toString(2).padStart(this.TOTAL_BITS, '0') // Pad with leading zeros

    const datacenterIdLeftShift = this.WORKER_ID_BITS + this.SEQUENCE_BITS
    const timestampLeftShift =
      this.DATA_CENTER_ID_BITS + this.WORKER_ID_BITS + this.SEQUENCE_BITS

    const binaryTimestamp = idBinary.substring(
      0,
      idBinary.length - timestampLeftShift
    )
    const binarySequence = idBinary.substring(
      idBinary.length - this.SEQUENCE_BITS
    )
    const binaryWorkerId = idBinary.substring(
      idBinary.length - datacenterIdLeftShift,
      idBinary.length - datacenterIdLeftShift + this.WORKER_ID_BITS
    )
    const binaryDatacenterId = idBinary.substring(
      idBinary.length - timestampLeftShift,
      idBinary.length - timestampLeftShift + this.DATA_CENTER_ID_BITS
    )

    const timestamp = BigInt('0b' + binaryTimestamp)
    const datetime = new Date(Number(timestamp) + this._customEpoch)

    return {
      timestamp,
      sequence: BigInt('0b' + binarySequence),
      workerId: BigInt('0b' + binaryWorkerId),
      dataCenterId: BigInt('0b' + binaryDatacenterId),
      epoch: this.customEpoch,
      dateTime: datetime,
    }
  }

  protected makeSequence(currentTimestamp: bigint) {
    if (currentTimestamp > this._lastTimestamp) {
      this._lastTimestamp = currentTimestamp
      this._sequence = 0n
      return this._sequence
    }

    if (this._sequence < this.MAX_SEQUENCE) {
      this._sequence++
      return this._sequence
    }

    // Sequence overflow, wait until next millisecond
    this._lastTimestamp = waitUntilNextMillisecond(
      this._customEpoch,
      currentTimestamp
    )
    this._sequence = 0n
    return this._sequence
  }
}

/**
 * Returns the current time in milliseconds, adjusted by the given parameter.
 * @param {number} adjust - The adjustment to subtract from the current time.
 */
function currentTime(adjust: number): number {
  return Date.now() - adjust
}

/**
 * Generates a random number between [0, scale].
 * @param {number} scale - The upper limit for the random number.
 */
function random(scale: number): number {
  return Math.floor(Math.random() * scale)
}

function waitUntilNextMillisecond(
  customEpoch: number,
  currentTimestamp: bigint
) {
  let nextTimestamp = BigInt(currentTime(customEpoch))

  while (nextTimestamp <= currentTimestamp) {
    nextTimestamp = BigInt(currentTime(customEpoch))
  }

  return nextTimestamp
}
