
# `@street-devs/snowflake-id` User Guide

## Overview

The `@street-devs/snowflake-id` package provides a class for generating unique 64-bit IDs using the Snowflake algorithm. 
It supports customizable options for epoch, machine ID, and worker ID, making each ID unique across distributed systems. 
Each generated ID consists of a timestamp, data center ID, worker ID, and sequence number.

## Installation

Install the package via npm:

```npm install @street-devs/snowflake-id```

## Usage

### 1. Import and Configure

```import { SnowflakeId, SnowflakeIdOptions } from '@street-devs/snowflake-id';```

### 2. Initialize SnowflakeId

The `SnowflakeId` class accepts an optional SnowflakeIdOptions configuration object to specify epoch, machine ID, and worker ID.
```
const options: SnowflakeIdOptions = {
  customEpoch: Date.now(),  // Optional, defaults to 2024-01-01T00:00:00Z
  machineId: 1,             // Optional, unique identifier for the machine
  workerId: 2               // Optional, unique identifier for the worker
};
const snowflakeId = new SnowflakeId(options);
```

### 3. Generate an ID

Use the `generate()` method to create a unique Snowflake ID.
```
const id = snowflakeId.generate();
console.log(id.toString());  // Example output: '1234567890123456789'
```

### 4. Decode an ID

The `decode(id)` method extracts the components of a Snowflake ID, providing details on when and where the ID was generated.
```
const decoded = snowflakeId.decode(id);
console.log(decoded);
// Output:
// {
//   dateTime: Date object,
//   timestamp: bigint,
//   dataCenterId: bigint,
//   workerId: bigint,
//   sequence: bigint,
//   epoch: number
// }
```

## API Reference

### `SnowflakeId` Class

#### Constructor: `new SnowflakeId(options?: SnowflakeIdOptions)`
- `options.customEpoch` - Custom epoch time in milliseconds (default: 2024-01-01T00:00:00Z).- 
- `options.machineId` - Machine ID for uniqueness across machines (default: random).- 
- `options.workerId` - Worker ID for uniqueness across workers (default: random).

#### Methods
- `generate(): bigint` - Generates a unique Snowflake ID as a 64-bit bigint.
- `decode(id: bigint): SnowflakeIdDecoded` - Decodes a given Snowflake ID, returning:
- `dateTime: Date` instance based on the timestamp.
- `timestamp: Timestamp` component of the ID.
- `dataCenterId`: Data center ID.
- `workerId`: Worker ID.
- `sequence`: Sequence number to prevent collisions within the same millisecond.
- `epoch`: Custom epoch used for the timestamp.

## Examples
```
const id = snowflakeId.generate();
console.log(`Generated ID: ${id}`);

const decodedId = snowflakeId.decode(id);
console.log(`Decoded components: `, decodedId);
```

## Additional Notes
- JSON Serialization: Includes a custom BigInt.toJSON() method that converts BigInt values to numbers for JSON compatibility.
- Bit Structure: Uses a fixed 64-bit Snowflake ID structure, allocating 42 bits for the timestamp, 5 bits for data center ID, 5 bits for worker ID, and 12 bits for the sequence.