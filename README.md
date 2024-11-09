# **`@street-devs/snowflake-id` - User Guide**

## Overview

The **`@street-devs/snowflake-id`** package provides a highly customizable Snowflake ID generator for NestJS applications. This generator produces unique 64-bit IDs based on the Snowflake algorithm, which consists of a timestamp, a node (instance) ID, and a sequence number. It also includes decoding capabilities to extract the components of generated IDs.

### Key Features:
- **Customizable epoch**: You can specify a custom start epoch for the ID generation.
- **Worker and Data Center IDs**: Each instance of the generator can have its own node ID, ensuring that generated IDs are unique across across multiple machines and data centers.
- **Concurrency-safe**: Handles sequence numbers within the same millisecond to avoid collisions.

---

## Installation

To install the package in your project, run:

```bash
npm install --save @street-devs/snowflake-id
```

---

## Usage

### 1. Importing and Configuring the Module

To use **`@street-devs/snowflake-id`** in your application, you need to import the module and configure it.

- `customEpoch` is an optional UNIX timestamp that marks the start of your Snowflake IDs. If not provided, the current time is used.
- `dataCenterId` allows you to set a unique data center ID, which should be between 0 and 31 (based on 5-bit configuration).
- `workerId`: allows you to set a unique worker ID, which should be between 0 and 31 (based on 5-bit configuration).

### 2. Generating IDs
The `generate()` method will return a unique **64-bit Snowflake ID** as a `bigint`.

### 3. Decoding IDs
You can also decode a Snowflake ID to extract its timestamp, instance ID, and sequence number.

The `decode()` method will return an object containing:
- `dateTime`: The exact date and time when the ID was generated.
- `timestamp`: Raw timestamp value.
- `dataCenterId`: The ID of the data center.
- `workerId`: The ID of the worker node.
- `sequence`: The sequence number ensuring uniqueness within the same millisecond.
- `epoch`: The custom epoch used.

---

## API Reference

### SnowflakeIdService Methods

1. **`generate()`**: Generates a unique 64-bit Snowflake ID.
    - Returns: `bigint`

2. **`decode(id: bigint)`**: Decodes the given Snowflake ID.
    - Parameters:
      - `id`: The Snowflake ID to decode.
    - Returns: `{ dateTime: Date, timestamp: bigint, dataCenterId: bigint, workerId: bigint, sequence: bigint, epoch: number }`

---


## Technical Details

### ID Structure (64 bits):

- **Epoch (42 bits)**: Used to store the timestamp (up to 139 years).
- **Worker ID (5 bits)**: Identifies the node generating the ID (supports up to 32 workers).
- **Data Center ID (5 bits)**: Identifies the data center (supports up to 32 data centers).
- **Sequence (12 bits)**: Ensures uniqueness within the same millisecond (can generate up to 4096 IDs per millisecond).

### Edge Cases:
- When multiple IDs are generated within the same millisecond, the sequence number will increment. If the sequence number reaches the limit (1023), the generator waits for the next millisecond.

---

## Example Use Case

```typescript
const snowflake = new SnowflakeId({ 
  customEpoch: 1609459200000, 
  dataCenterId: 1, 
  workerId: 1 
});
const newId = snowflake.generate();
console.log(newId);  // Example output: 93977444276639021
const decoded = snowflake.decode(newId);
console.log(decoded); 
// {
//   "dateTime": "2024-09-16T07:52:48.732Z",
//   "timestamp": 1726473168732,
//   "dataCenterId": 1,
//   "workerId": 1,
//   "sequence": 1325,
//   "epoch": 1704067200000
// }
```

---

## License

This package is open-sourced under the MIT License.