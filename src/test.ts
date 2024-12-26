import { SnowflakeId } from './index'

const snowflakeId = new SnowflakeId()

const res: bigint[] = []

for (let i = 0; i < 4099; i++) {
  res.push(snowflakeId.generate())
}

console.log(res.slice(Math.max(res.length - 5, 0)))
